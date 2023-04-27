import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { arrayify, defaultAbiCoder, hexConcat, keccak256 } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"
import { fillUserOp, signOp } from "../utils"
import { P2565Signer } from "./signer"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const accountTpl = await ethers.getContractFactory("P256Account")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const paymaster = await ethers.getContract("VerifyingPaymaster")

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

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
    }

    const fullCreateOp = await fillUserOp(transferOp, entryPoint)
    fullCreateOp.paymasterAndData = hexConcat([
        paymaster.address,
        defaultAbiCoder.encode(["uint48", "uint48"], [0, 0]),
        "0x" + "00".repeat(65),
    ])

    const validAfter = Math.floor(new Date().getTime() / 1000)
    const validUntil = validAfter + 86400 // one day
    const pendingOpHash = await paymaster.getHash(fullCreateOp, validUntil, validAfter)
    const paymasterSignature = await signer.signMessage(arrayify(pendingOpHash))
    fullCreateOp.paymasterAndData = hexConcat([
        paymaster.address,
        defaultAbiCoder.encode(["uint48", "uint48"], [validUntil, validAfter]),
        paymasterSignature,
    ])

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
    console.log(`transfer use paymaster tx: ${tx.hash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
