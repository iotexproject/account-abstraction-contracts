import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { arrayify, defaultAbiCoder, hexConcat, resolveProperties } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"
import { deepHexlify, fillUserOp, signOp } from "../utils"
import { P2565Signer } from "./signer"
import { JsonRpcProvider } from "@ethersproject/providers"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const accountTpl = await ethers.getContractFactory("P256Account")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const paymaster = new JsonRpcProvider("http://localhost:8888")
    const bundler = new JsonRpcProvider("http://localhost:4337")

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)

    const index = 0
    const account = await factory.getAddress(publicKey, index)

    const callData = accountTpl.interface.encodeFunctionData("execute", [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ethers.utils.parseEther("0.1"),
        "0x",
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
