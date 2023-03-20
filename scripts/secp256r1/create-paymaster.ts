import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { arrayify, defaultAbiCoder, hexConcat, keccak256 } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain/contracts/samples/secp256r1/P256AccountFactory"
import { EntryPoint } from "../../typechain/contracts/core/EntryPoint"
import { fillUserOp, signOp } from "../utils"
import { P2565Signer } from "./signer"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const paymaster = await ethers.getContract("VerifyingPaymaster")

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)

    const index = 1
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
    fullCreateOp.paymasterAndData = hexConcat([paymaster.address, defaultAbiCoder.encode(['uint48', 'uint48'], [0, 0]), '0x' + '00'.repeat(65)])

    const validAfter = Math.floor(new Date().getTime() / 1000)
    const validUntil = validAfter + 86400 // one day
    const pendingOpHash = await paymaster.getHash(fullCreateOp, validUntil, validAfter)
    const paymasterSignature = await signer.signMessage(arrayify(pendingOpHash))
    fullCreateOp.paymasterAndData = hexConcat(
        [paymaster.address, defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]), paymasterSignature])

    const chainId = (await ethers.provider.getNetwork()).chainId
    const signedOp = await signOp(
        fullCreateOp,
        entryPoint.address,
        chainId,
        new P2565Signer(keyPair)
    )

    // check paymaster staking
    const staking = await entryPoint.balanceOf(paymaster.address)
    if (staking.toString() === "0") {
        console.log(`deposit staking to paymaster: ${paymaster.address}`)
        const tx = await entryPoint.depositTo(paymaster.address, {value: ethers.utils.parseEther("2.0")})
        await tx.wait()
    } else {
        console.log(`paymaster staking amount: ${ethers.utils.formatEther(staking)}`)
    }

    const err = await entryPoint.callStatic.simulateValidation(signedOp).catch((e) => e)
    if (err.errorName === "FailedOp") {
        console.error(`simulate op error ${err.errorArgs.at(-1)}`)
    } else if (err.errorName !== "ValidationResult") {
        console.error(`unknow error ${err}`)
    }

    const tx = await entryPoint.connect(bundler).handleOps([signedOp], bundler.address)
    console.log(`create use paymaster tx: ${tx.hash}, account: ${account}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
