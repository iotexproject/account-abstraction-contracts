import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"
import { hexConcat } from "ethers/lib/utils"

import { P256AccountFactory } from "../../typechain/contracts/samples/secp256r1/P256AccountFactory"
import { EntryPoint } from "../../typechain/contracts/core/EntryPoint"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)
    const address = await factory.getAddress(publicKey, 0)

    const initCode = hexConcat([
        factory.address,
        factory.interface.encodeFunctionData("createAccount", [publicKey, 0]),
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
