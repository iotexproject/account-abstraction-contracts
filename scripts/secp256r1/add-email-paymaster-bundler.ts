import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { resolveProperties } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"
import { deepHexlify, fillUserOp, signOp } from "../utils"
import { P2565Signer } from "./signer"
import { JsonRpcProvider } from "@ethersproject/providers"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const accountTpl = await ethers.getContractFactory("P256Account")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const paymaster = new JsonRpcProvider("https://paymaster.testnet.iotex.io")
    const bundler = new JsonRpcProvider("https://bundler.testnet.iotex.io")

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)

    const index = 0
    const account = await factory.getAddress(publicKey, index)

    const callData = accountTpl.interface.encodeFunctionData("execute", [
        account,
        0,
        "0x99a4453183a3351928007a2dd3f6c9385984d49c2b2761c0cb7110ba9a0a80acf3719597",
    ])

    const transferOp = {
        sender: account,
        callData,
        preVerificationGas: 50000,
    }

    const fullCreateOp = await fillUserOp(transferOp, entryPoint)
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

    hexifiedUserOp = deepHexlify(await resolveProperties(signedOp))
    result = await bundler.send("eth_sendUserOperation", [hexifiedUserOp, entryPoint.address])
    console.log(`transfer use bundler success opHash: ${result}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
