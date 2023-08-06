import { Client } from "userop"
import { ethers } from "hardhat"
import { Presets } from "userop"
import { EntryPoint } from "@account-abstraction/contracts"

async function main() {
    const rpc = "https://babel-api.testnet.iotex.io"
    const bundlerRpc = "http://localhost:4337"
    //const bundlerRpc = "https://bundler.testnet.w3bstream.com"
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const accountFactory = await ethers.getContract("SimpleAccountFactory")
    const client = await Client.init(rpc, {
        entryPoint: entryPoint.address,
        overrideBundlerRpc: bundlerRpc,
    })
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider)

    const simpleAccountBuilder = await Presets.Builder.SimpleAccount.init(
        signer,
        rpc,
        {
            overrideBundlerRpc: bundlerRpc,
            factory: accountFactory.address,
            entryPoint: entryPoint.address,
            salt: 1,
        }
    )

    const account = simpleAccountBuilder.getSender()

    const stake = await entryPoint.balanceOf(account)
    if (stake.isZero()) {
        console.log(`deposit gas for account ${account}`)
        const tx = await entryPoint
            .connect(signer) // use signer for stake gas
            .depositTo(account, { value: ethers.utils.parseEther("10") })
        await tx.wait()
    }

    const response = await client.sendUserOperation(simpleAccountBuilder)
    console.log(`Create account ${account} ophash: ${response.userOpHash}`)
    const userOperationEvent = await response.wait()
    console.log(`Create account ${account} txhash: ${userOperationEvent?.transactionHash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
