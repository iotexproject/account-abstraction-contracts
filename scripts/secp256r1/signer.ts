import crypto from "crypto"
import { bufferToHex, sha256 } from "ethereumjs-util"
import { AccountSigner } from "../utils"
import { defaultAbiCoder } from "ethers/lib/utils"

export const sign = (keyPair, message) => {
    const messageHash = bufferToHex(sha256(message))

    const signer = crypto.createSign("RSA-SHA256")
    signer.update(message)
    let sigString = signer.sign(keyPair.encodePrivateKey(), "hex")

    // @ts-ignore
    const xlength = 2 * ("0x" + sigString.slice(6, 8))
    sigString = sigString.slice(8)
    const signatureArray = ["0x" + sigString.slice(0, xlength), "0x" + sigString.slice(xlength + 4)]
    const signature = defaultAbiCoder.encode(
        ["uint256", "uint256"],
        [signatureArray[0], signatureArray[1]]
    )

    return {
        messageHash,
        signature,
    }
}

export class P2565Signer implements AccountSigner {
    private keyPair: any

    constructor(keyPair: any) {
        this.keyPair = keyPair
    }

    async sign(opHash: string): Promise<string> {
        console.log(`siging opHash: ${opHash}`)
        const result = sign(this.keyPair, Buffer.from(opHash.substring(2), "hex"))
        console.log(`signed messageHash: ${result.messageHash}`)
        return result.signature
    }
}
