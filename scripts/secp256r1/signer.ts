import crypto from "crypto"
import { bufferToHex, sha256 } from "ethereumjs-util"
import { utils } from "ethers"

const abiCoder = new utils.AbiCoder()

export const sign = (keyPair, message) => {
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

    return {
        messageHash,
        signature,
    }
}
