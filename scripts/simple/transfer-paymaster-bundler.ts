import { Client, Presets } from "userop"
import { ethers } from "hardhat"
import { EntryPoint } from "@account-abstraction/contracts"

async function main() {
    const rpc = "https://babel-api.testnet.iotex.io"
    const bundlerRpc = "https://bundler.testnet.w3bstream.com"
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const accountFactory = await ethers.getContract("SimpleAccountFactory")
    const accountTpl = await ethers.getContractFactory("P256Account")
    const client = await Client.init(rpc, {
        entryPoint: entryPoint.address,
        overrideBundlerRpc: bundlerRpc,
    })
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider)
    const callData = accountTpl.interface.encodeFunctionData("execute", [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ethers.utils.parseEther("0.1"),
        "0x",
    ])

    const simpleAccountBuilder = await Presets.Builder.SimpleAccount.init(signer, rpc, {
        overrideBundlerRpc: bundlerRpc,
        factory: accountFactory.address,
        entryPoint: entryPoint.address,
        salt: "1",
        paymasterMiddleware: Presets.Middleware.verifyingPaymaster(
            // paymaster rpc
            `https://paymaster.testnet.w3bstream.com/rpc/${process.env.API_KEY}`,
            ""
        ),
    })
    simpleAccountBuilder.setCallData(callData)

    const account = simpleAccountBuilder.getSender()

    const response = await client.sendUserOperation(simpleAccountBuilder)
    console.log(`Transfer ${account} ophash: ${response.userOpHash}`)
    const userOperationEvent = await response.wait()
    console.log(`Transfer ${account} txhash: ${userOperationEvent?.transactionHash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
