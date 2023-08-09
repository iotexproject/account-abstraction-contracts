import crypto from "crypto"
import { bufferToHex, sha256 } from "ethereumjs-util"
import { defaultAbiCoder } from "ethers/lib/utils"
import { UserOperationMiddlewareFn } from "userop"

// @ts-ignore
export const sign = (keyPair: any, message: any) => {
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

export class P2565Signer {
    private keyPair: any

    constructor(keyPair: any) {
        this.keyPair = keyPair
    }

    publicKey(): string {
        return "0x" + this.keyPair.getPublicKey("hex").substring(2)
    }

    async sign(opHash: string): Promise<string> {
        const result = sign(this.keyPair, Buffer.from(opHash.substring(2), "hex"))
        return result.signature
    }
}

export const P256Signature =
    (signer: P2565Signer): UserOperationMiddlewareFn =>
    async (ctx) => {
        ctx.op.signature = await signer.sign(ctx.getUserOpHash())
    }
