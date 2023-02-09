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

    const { messageHash, signature } = sign(
        keyPair,
        Buffer.from("fa912867570fc323471f1dc22e6c6cc6a8ce88ab9ef3229a800f5b3e46520750", "hex")
    )

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
