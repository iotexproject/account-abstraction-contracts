import { ethers } from "hardhat"
import { SimpleAccount } from "../typechain/contracts/samples/SimpleAccount"
import { SimpleAccountFactory } from "../typechain/contracts/samples/SimpleAccountFactory"
import { EntryPoint } from "../typechain/contracts/core/EntryPoint"
import { signOp, UserOperation } from "./utils"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory
    const accountTemp = await ethers.getContractFactory("SimpleAccount")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint

    const owner = new ethers.Wallet(process.env.OWNER!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

    const account = await factory.getAddress(owner.address, 1)
    const initCode =
        factory.address +
        factory.interface.encodeFunctionData("createAccount", [owner.address, 1]).substring(2)
    const callData = accountTemp.interface.encodeFunctionData("execute", [
        "0x355BE1cbfFBf803fdb17E0CB207D051cD9816916",
        "100",
        "0x",
    ])
    const createOp = {
        sender: account,
        nonce: 0,
        initCode: initCode,
        callData: callData, // create account and transfer to 0x355BE1cbfFBf803fdb17E0CB207D051cD9816916
        callGasLimit: 100000,
        verificationGasLimit: 100000,
        preVerificationGas: ethers.utils.parseEther("0.000001"),
        maxFeePerGas: ethers.utils.parseEther("0.000001"),
        maxPriorityFeePerGas: ethers.utils.parseEther("0.000001"),
        paymasterAndData: "0x",
        signature: "0x",
    }

    const chainId = (await ethers.provider.getNetwork()).chainId
    const signedOp = await signOp(createOp, entryPoint.address, chainId, owner)

    const stake = await entryPoint.balanceOf(account)
    if (stake.isZero()) {
        await entryPoint.connect(bundler).depositTo(account, {value: ethers.utils.parseEther("10")})
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
