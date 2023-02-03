import { ethers } from "hardhat"
import { SimpleAccountFactory } from "../../typechain/contracts/samples/SimpleAccountFactory"
import { EntryPoint } from "../../typechain/contracts/core/EntryPoint"
import { fillUserOp, signOp } from "../utils"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory
    const accountTemp = await ethers.getContractFactory("SimpleAccount")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint

    const owner = new ethers.Wallet(process.env.OWNER!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

    const account = await factory.getAddress(owner.address, 2)
    const initCode =
        factory.address +
        factory.interface.encodeFunctionData("createAccount", [owner.address, 2]).substring(2)
    const callData = accountTemp.interface.encodeFunctionData("execute", [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "100",
        "0x",
    ])
    const createOp = {
        sender: account,
        nonce: 0,
        initCode: initCode,
        callData: callData, // create account and transfer to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    }
    const fullCreateOp = await fillUserOp(createOp, entryPoint)

    const chainId = (await ethers.provider.getNetwork()).chainId
    const signedOp = await signOp(fullCreateOp, entryPoint.address, chainId, owner)

    const stake = await entryPoint.balanceOf(account)
    if (stake.isZero()) {
        console.log(`deposit gas for account ${account}`)
        await entryPoint
            .connect(bundler)
            .depositTo(account, { value: ethers.utils.parseEther("1") })
    }
    const balance = await ethers.provider.getBalance(account)
    if (balance.isZero()) {
        console.log(`fund to account ${account}`)
        const valueTx = await bundler.sendTransaction({
            to: account,
            value: ethers.utils.parseEther("1")
        })
        await valueTx.wait()
    }

    const tx = await entryPoint.connect(bundler).handleOps([signedOp], bundler.address)

    console.log(`create and transfer tx: ${tx.hash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
