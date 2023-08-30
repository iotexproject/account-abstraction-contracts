import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"
import { Client } from "userop"
import { P256Account } from "../userop/p256-account"
import { P2565Signer } from "../userop/p256-signature"

// TODO need create account first
async function main() {
    const rpc = "https://babel-api.testnet.iotex.io"
    const bundlerRpc = "https://bundler.testnet.w3bstream.com"
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

    const accountBuilder = await P256Account.init(signer, rpc, {
        overrideBundlerRpc: bundlerRpc,
        factory: accountFactory.address,
        entryPoint: entryPoint.address,
        salt: 1,
    })
    const account = accountBuilder.getSender()

    const callData = accountTpl.interface.encodeFunctionData("execute", [
        account,
        0,
        accountTpl.interface.encodeFunctionData("addEmailGuardian", [
            // email
            "0x37c46ee7d1e7eadf71a0aa183942a62007c6b96d9300b177e3b4f721c9989f2c",
            // signature
            "0x7d76948c532ad201ade9eab9551759ff3264d6d1db7f76385b756cd92ee4b749379c3069cb4ce88f4ea1710fc8a1b4c98825115f2d616ab2032e77324906b2901c",
        ]),
    ])
    accountBuilder.setCallData(callData)

    const stake = await entryPoint.balanceOf(account)
    if (stake.isZero()) {
        console.log(`Stake gas for account ${account}`)
        const [owner] = await ethers.getSigners()
        const tx = await entryPoint
            .connect(owner)
            .depositTo(account, { value: ethers.utils.parseEther("2") })
        await tx.wait()
    }

    const response = await client.sendUserOperation(accountBuilder)
    console.log(`Add email guardian to account ${account} ophash: ${response.userOpHash}`)
    const userOperationEvent = await response.wait()
    console.log(
        `Add email guardian to account ${account} txhash: ${userOperationEvent?.transactionHash}`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
