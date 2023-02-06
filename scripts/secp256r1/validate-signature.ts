import { ethers } from "hardhat"
import * as fs from "fs"
import * as path from "path"
import crypto from "crypto"
import ecPem from "ec-pem"
import { bufferToHex, sha256 } from "ethereumjs-util"

import { EllipticCurve } from "../../typechain/contracts/samples/secp256r1/EllipticCurve"
import { utils } from "ethers"

async function main() {
    const validator = (await ethers.getContract("EllipticCurve")) as EllipticCurve

    const abiCoder = new utils.AbiCoder()
    const keyContent = fs.readFileSync(path.join(__dirname, "key.pem"))
    const keyPair = ecPem.loadPrivateKey(keyContent)

    const message = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substring(0, 5)
    const messageHash = bufferToHex(sha256(Buffer.from(message)))

    const signer = crypto.createSign("RSA-SHA256")
    signer.update(message)
    let sigString = signer.sign(keyPair.encodePrivateKey(), "hex")

    // @ts-ignore
    const xlength = 2 * ("0x" + sigString.slice(6, 8))
    sigString = sigString.slice(8)
    const signatureArray = ["0x" + sigString.slice(0, xlength), "0x" + sigString.slice(xlength + 4)]
    const signature = abiCoder.encode(
        ["uint256", "uint256"],
        [signatureArray[0], signatureArray[1]]
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
