import { BigNumberish, Signer, Wallet } from "ethers"
import { BytesLike } from "@ethersproject/bytes"
import { arrayify, defaultAbiCoder, keccak256 } from "ethers/lib/utils"

export interface UserOperation {
    sender: string
    nonce: BigNumberish
    initCode: BytesLike
    callData: BytesLike
    callGasLimit: BigNumberish
    verificationGasLimit: BigNumberish
    preVerificationGas: BigNumberish
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
    paymasterAndData: BytesLike
    signature: BytesLike
}

export function getUserOpHash(op: UserOperation, entryPoint: string, chainId: number): string {
    const userOpHash = keccak256(packUserOp(op, true))
    const enc = defaultAbiCoder.encode(
        ["bytes32", "address", "uint256"],
        [userOpHash, entryPoint, chainId]
    )
    return keccak256(enc)
}

export function packUserOp(op: UserOperation, forSignature = true): string {
    if (forSignature) {
        // lighter signature scheme (must match UserOperation#pack): do encode a zero-length signature, but strip afterwards the appended zero-length value
        const userOpType = {
            components: [
                { type: "address", name: "sender" },
                { type: "uint256", name: "nonce" },
                { type: "bytes", name: "initCode" },
                { type: "bytes", name: "callData" },
                { type: "uint256", name: "callGasLimit" },
                { type: "uint256", name: "verificationGasLimit" },
                { type: "uint256", name: "preVerificationGas" },
                { type: "uint256", name: "maxFeePerGas" },
                { type: "uint256", name: "maxPriorityFeePerGas" },
                { type: "bytes", name: "paymasterAndData" },
                { type: "bytes", name: "signature" },
            ],
            name: "userOp",
            type: "tuple",
        }
        let encoded = defaultAbiCoder.encode([userOpType as any], [{ ...op, signature: "0x" }])
        // remove leading word (total length) and trailing word (zero-length signature)
        encoded = "0x" + encoded.slice(66, encoded.length - 64)
        return encoded
    }
    const typevalues = [
        { type: "address", val: op.sender },
        { type: "uint256", val: op.nonce },
        { type: "bytes", val: op.initCode },
        { type: "bytes", val: op.callData },
        { type: "uint256", val: op.callGasLimit },
        { type: "uint256", val: op.verificationGasLimit },
        { type: "uint256", val: op.preVerificationGas },
        { type: "uint256", val: op.maxFeePerGas },
        { type: "uint256", val: op.maxPriorityFeePerGas },
        { type: "bytes", val: op.paymasterAndData },
    ]
    if (!forSignature) {
        // for the purpose of calculating gas cost, also hash signature
        typevalues.push({ type: "bytes", val: op.signature })
    }
    return encode(typevalues, forSignature)
}

function encode(typevalues: Array<{ type: string; val: any }>, forSignature: boolean): string {
    const types = typevalues.map((typevalue) =>
        typevalue.type === "bytes" && forSignature ? "bytes32" : typevalue.type
    )
    const values = typevalues.map((typevalue) =>
        typevalue.type === "bytes" && forSignature ? keccak256(typevalue.val) : typevalue.val
    )
    return defaultAbiCoder.encode(types, values)
}

export async function signOp(
    op: UserOperation,
    entryPoint: string,
    chainId: number,
    signer: Wallet | Signer
): Promise<UserOperation> {
    const message = arrayify(getUserOpHash(op, entryPoint, chainId))

    return {
        ...op,
        signature: await signer.signMessage(message),
    }
}
