import { ethers } from "hardhat"
import { SimpleAccountFactory } from "../../typechain/contracts/samples/SimpleAccountFactory"
import { EntryPoint } from "../../typechain/contracts/core/EntryPoint"
import { ECDSASigner, fillUserOp, signOp } from "../utils"
import { hexConcat } from "ethers/lib/utils"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint

    const owner = new ethers.Wallet(process.env.OWNER!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

    const account = await factory.getAddress(owner.address, 1)

    const initCode = hexConcat([
        factory.address,
        factory.interface.encodeFunctionData("createAccount", [owner.address, 1]),
    ])
    const createOp = {
        sender: account,
        initCode: initCode,
    }
    const fullCreateOp = await fillUserOp(createOp, entryPoint)

    const chainId = (await ethers.provider.getNetwork()).chainId
    const signedOp = await signOp(fullCreateOp, entryPoint.address, chainId, new ECDSASigner(owner))

    const tx = await entryPoint.connect(bundler).handleOps([signedOp], bundler.address)

    console.log(`create use entrypoint tx: ${tx.hash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
