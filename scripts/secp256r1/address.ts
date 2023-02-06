import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import crypto from "crypto"
import ecPem from "ec-pem"

import { P256AccountFactory } from "../../typechain/contracts/samples/secp256r1/P256AccountFactory"

async function main() {
    const factory = (await ethers.getContract("P256AccountFactory")) as P256AccountFactory

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)
    const address = await factory.getAddress(publicKey, 0)

    console.log(`${publicKey} account address: ${address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
