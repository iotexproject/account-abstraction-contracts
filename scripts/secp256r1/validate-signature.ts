import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import ecPem from "ec-pem"

import { EllipticCurve } from "../../typechain/contracts/samples/secp256r1/EllipticCurve"
import { sign } from "./signer"

async function main() {
    const validator = (await ethers.getContract("EllipticCurve")) as EllipticCurve

    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const message = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substring(0, 5)

    const { messageHash, signature } = sign(keyPair, message)

    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)
    const result = await validator["validateSignature(bytes32,bytes,bytes)"](
        messageHash,
        signature,
        publicKey
    )

    console.log(`validate result: ${result}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
