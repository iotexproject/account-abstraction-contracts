import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { EntryPoint } from "@account-abstraction/contracts"
import { Client } from "userop"
import { P256AccountFactory } from "../../typechain"
import { P2565Signer } from "../userop/p256-signature"
import { P256Account } from "../userop/p256-account"

async function main() {
    const rpc = "https://babel-api.testnet.iotex.io"
    const bundlerRpc = "http://localhost:4337"
    // const bundlerRpc = "https://bundler.testnet.w3bstream.com"
    const accountFactory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const accountTpl = await ethers.getContractFactory("P256Account")
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint
    const client = await Client.init(rpc, {
        entryPoint: entryPoint.address,
        overrideBundlerRpc: bundlerRpc,
    })

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)
    const signer = new P2565Signer(keyPair)

    const callData = accountTpl.interface.encodeFunctionData("execute", [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ethers.utils.parseEther("0.1"),
        "0x",
    ])

    const simpleAccountBuilder = await P256Account.init(signer, rpc, {
        overrideBundlerRpc: bundlerRpc,
        factory: accountFactory.address,
        entryPoint: entryPoint.address,
        salt: 1,
    })
    simpleAccountBuilder.setCallData(callData)

    const account = simpleAccountBuilder.getSender()

    const response = await client.sendUserOperation(simpleAccountBuilder)
    console.log(`Transfer account ${account} ophash: ${response.userOpHash}`)
    const userOperationEvent = await response.wait()
    console.log(`Transfer account ${account} txhash: ${userOperationEvent?.transactionHash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
