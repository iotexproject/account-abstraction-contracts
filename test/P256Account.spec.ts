import { Signer } from "ethers"
import { ethers } from "hardhat"
import ecPem from "ec-pem"
import crypto from "crypto"
import { expect } from "chai"

import {
    EllipticCurve,
    EntryPoint,
    P256Account,
    P256Account__factory,
    P256AccountFactory,
    P256AccountFactory__factory,
} from "../typechain/"
import { P2565Signer, sign } from "../scripts/secp256r1/signer"
import { hexConcat } from "ethers/lib/utils"
import { fillUserOp, signOp } from "../scripts/utils"

function loadKey() {
    return ecPem.loadPrivateKey(`
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIBbDF3PMLilq5FRILqtdk5qQ2kE7JvkIY4SgRTXFTAcEoAoGCCqGSM49
AwEHoUQDQgAEVr5gJkJlK92Xvg/TntirzTVh77/unY5bQ9j4wwMhFFOuzsip5Tgb
aO0DKhADDz58KI8oPmqmOIjeBhf/HXWC+Q==
-----END EC PRIVATE KEY-----
    `)
}

export async function createAccount(
    ethersSigner: Signer,
    entryPoint: string,
    publicKey: string,
    validator: string,
    salt: string,
    _factory?: P256AccountFactory
): Promise<{
    proxy: P256Account
    accountFactory: P256AccountFactory
    implementation: string
}> {
    const accountFactory =
        _factory ??
        (await new P256AccountFactory__factory(ethersSigner).deploy(entryPoint, validator))
    const implementation = await accountFactory.accountImplementation()
    await accountFactory.createAccount(publicKey, salt)
    const accountAddress = await accountFactory.getAddress(publicKey, salt)
    const proxy = P256Account__factory.connect(accountAddress, ethersSigner)
    return {
        proxy,
        accountFactory,
        implementation,
    }
}

describe("P256Account", () => {
    let entryPoint: EntryPoint
    let validator: EllipticCurve
    let accountFactory: P256AccountFactory
    const keyPair = loadKey()
    const publicKey = "0x" + keyPair.getPublicKey("hex").substring(2)
    let accounts: string[]

    before(async function () {
        accounts = await ethers.provider.listAccounts()

        const entryPointFactroy = await ethers.getContractFactory("EntryPoint")
        entryPoint = (await entryPointFactroy.deploy()) as EntryPoint

        const curveFactory = await ethers.getContractFactory("EllipticCurve")
        validator = (await curveFactory.deploy()) as EllipticCurve

        const accountFactoryFactory = await ethers.getContractFactory("P256AccountFactory")
        accountFactory = (await accountFactoryFactory.deploy(
            entryPoint.address,
            validator.address
        )) as P256AccountFactory
    })

    it("should have correct info", async () => {
        const { proxy: account } = await createAccount(
            ethers.provider.getSigner(),
            entryPoint.address,
            "0x" + keyPair.getPublicKey("hex").substring(2),
            validator.address,
            "0x0",
            accountFactory
        )

        expect(await account.publicKey()).to.equal(
            "0x56be602642652bdd97be0fd39ed8abcd3561efbfee9d8e5b43d8f8c303211453aecec8a9e5381b68ed032a10030f3e7c288f283e6aa63888de0617ff1d7582f9"
        )
        expect(await account.entryPoint()).to.equal(entryPoint.address)
    })

    it("validate secp256r1 signature", async () => {
        var prime256v1 = crypto.createECDH("prime256v1")
        prime256v1.generateKeys()

        var keyPair = ecPem(prime256v1, "prime256v1")

        const { messageHash, signature } = sign(keyPair, Buffer.from("123"))
        const publicKey1 = "0x" + prime256v1.getPublicKey("hex").slice(2)
        const publicKey2 = "0x" + keyPair.getPublicKey("hex").substring(2)

        expect(publicKey1).to.eq(publicKey2)
        expect(
            await validator["validateSignature(bytes32,bytes,bytes)"](
                messageHash,
                signature,
                publicKey1
            )
        ).to.equal(true)
    })

    it("withdraw with secp256r1 signature", async () => {
        const sender = await accountFactory.getAddress(publicKey, 0)
        await accountFactory.createAccount(publicKey, 0)
        const account =  P256Account__factory.connect(sender, ethers.provider.getSigner())

        // TODO
    })
})
