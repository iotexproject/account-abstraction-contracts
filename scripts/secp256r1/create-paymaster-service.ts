import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { hexConcat, resolveProperties } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"
import { deepHexlify, fillUserOp, signOp } from "../utils"
import { P2565Signer } from "./signer"
import { JsonRpcProvider } from "@ethersproject/providers"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const paymaster = new JsonRpcProvider("https://paymaster.testnet.iotex.io")

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)
    console.log(`signer address: ${signer.address}`)
    console.log(`bundler address: ${bundler.address}`)

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)

    const index = 0
    const account = await factory.getAddress(publicKey, index)

    const initCode = hexConcat([
        factory.address,
        factory.interface.encodeFunctionData("createAccount", [publicKey, index]),
    ])
    const createOp = {
        sender: account,
        initCode: initCode,
    }

    const fullCreateOp = await fillUserOp(createOp, entryPoint)
    let hexifiedUserOp = deepHexlify(await resolveProperties(fullCreateOp))
    let result = await paymaster.send("eth_signVerifyingPaymaster", [hexifiedUserOp])
    fullCreateOp.paymasterAndData = result

    const chainId = (await ethers.provider.getNetwork()).chainId
    const signedOp = await signOp(
        fullCreateOp,
        entryPoint.address,
        chainId,
        new P2565Signer(keyPair)
    )

    const err = await entryPoint.callStatic.simulateValidation(signedOp).catch((e) => e)
    if (err.errorName === "FailedOp") {
        console.error(`simulate op error ${err.errorArgs.at(-1)}`)
        return
    } else if (err.errorName !== "ValidationResult") {
        console.error(`unknow error ${err}`)
        return
    }
    console.log(`simulate op success`)

    const tx = await entryPoint.connect(bundler).handleOps([signedOp], bundler.address)
    console.log(`create use paymaster tx: ${tx.hash}, account: ${account}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
