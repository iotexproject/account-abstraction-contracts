import crypto from "crypto"
import { bufferToHex, sha256 } from "ethereumjs-util"
import { utils } from "ethers"
import ecPem from "ec-pem"
import { AccountSigner, UserOperation } from "../utils"
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils"

const abiCoder = new utils.AbiCoder()

export const sign = (keyPair, message) => {
    const messageHash = bufferToHex(sha256(message))

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

export function userOpHash(op: UserOperation): string {
    const userOpType = {
        components: [
            { type: "address", name: "sender" },
            { type: "uint256", name: "nonce" },
            { type: "bytes32", name: "initCode" },
            { type: "bytes32", name: "callData" },
            { type: "uint256", name: "callGasLimit" },
            { type: "uint256", name: "verificationGasLimit" },
            { type: "uint256", name: "preVerificationGas" },
            { type: "uint256", name: "maxFeePerGas" },
            { type: "uint256", name: "maxPriorityFeePerGas" },
        ],
        name: "userOp",
        type: "tuple",
    }
    const op1 = { ...op }
    op1.initCode = keccak256(op.initCode)
    op1.callData = keccak256(op.callData)
    return defaultAbiCoder.encode([userOpType as any], [{ ...op1 }])
}
