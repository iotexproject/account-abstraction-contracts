import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { hexConcat } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain"
import { EntryPoint } from "@account-abstraction/contracts"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)
    const index = 0
    const address = await factory.getAddress(publicKey, index)

    const initCode = hexConcat([
        factory.address,
        factory.interface.encodeFunctionData("createAccount", [publicKey, index]),
    ])
    const entryPoint = (await ethers.getContract("EntryPoint")) as EntryPoint

    const entryReturnAddress = await entryPoint.callStatic
        .getSenderAddress(initCode)
        .catch((e) => e.errorArgs.sender)
    if (address != entryReturnAddress) {
        return console.error("account address dismatch")
    }

    console.log(`${publicKey} account address: ${address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
