import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"

import { ethers } from "hardhat"
import { EntryPoint, P256AccountFactory } from "../../typechain"
import { P256Account } from "../userop/p256-account"
import { P2565Signer } from "../userop/p256-signature"

async function main() {
    const rpc = "https://babel-api.testnet.iotex.io"
    const bundlerRpc = "https://bundler.testnet.w3bstream.com"
    const accountFactory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)
    const signer = new P2565Signer(keyPair)

    const accountBuilder = await P256Account.init(signer, rpc, {
        overrideBundlerRpc: bundlerRpc,
        factory: accountFactory.address,
        entryPoint: entryPoint.address,
        salt: 0,
    })
    const account = accountBuilder.getSender()

    const { chainId } = await ethers.provider.getNetwork()
    const message = `Send an email with below text as subject to iopay-recover@iotex.me\n01${chainId}${account.toLowerCase()}${signer.publicKey()}`

    console.log(message)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
