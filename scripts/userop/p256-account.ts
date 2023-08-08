import * as ethers from "ethers"
import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts"
import {
    P256AccountFactory__factory,
    P256Account__factory,
    P256Account as P256AccountImpl,
    P256AccountFactory,
} from "../../typechain"
import {
    BundlerJsonRpcProvider,
    IPresetBuilderOpts,
    UserOperationBuilder,
    UserOperationMiddlewareFn,
    Presets,
} from "userop"
import { P2565Signer, P256Signature } from "./signature"

export const ERC4337 = {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    P256Account: {
        Factory: "0x9406Cc6185a346906296840746125a0E44976454",
    },
}

export class P256Account extends UserOperationBuilder {
    private signer: P2565Signer
    private provider: ethers.providers.JsonRpcProvider
    private entryPoint: EntryPoint
    private factory: P256AccountFactory
    private initCode: string
    proxy: P256AccountImpl

    private constructor(signer: P2565Signer, rpcUrl: string, opts?: IPresetBuilderOpts) {
        super()
        this.signer = signer
        this.provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(opts?.overrideBundlerRpc)
        this.entryPoint = EntryPoint__factory.connect(
            opts?.entryPoint || ERC4337.EntryPoint,
            this.provider
        )
        this.factory = P256AccountFactory__factory.connect(
            opts?.factory || ERC4337.P256Account.Factory,
            this.provider
        )
        this.initCode = "0x"
        this.proxy = P256Account__factory.connect(ethers.constants.AddressZero, this.provider)
    }

    private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
        ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0)
        ctx.op.initCode = ctx.op.nonce.eq(0) ? this.initCode : "0x"
    }

    public static async init(
        signer: P2565Signer,
        rpcUrl: string,
        opts?: IPresetBuilderOpts
    ): Promise<P256Account> {
        const instance = new P256Account(signer, rpcUrl, opts)

        try {
            instance.initCode = await ethers.utils.hexConcat([
                instance.factory.address,
                instance.factory.interface.encodeFunctionData("createAccount", [
                    signer.publicKey(),
                    ethers.BigNumber.from(opts?.salt ?? 0),
                ]),
            ])
            await instance.entryPoint.callStatic.getSenderAddress(instance.initCode)

            throw new Error("getSenderAddress: unexpected result")
        } catch (error: any) {
            const addr = error?.errorArgs?.sender
            if (!addr) throw error

            instance.proxy = P256Account__factory.connect(addr, instance.provider)
        }

        const base = instance
            .useDefaults({
                sender: instance.proxy.address,
                signature: await instance.signer.sign(ethers.utils.keccak256("0xdead")),
            })
            .useMiddleware(instance.resolveAccount)
            .useMiddleware(Presets.Middleware.getGasPrice(instance.provider))

        const withPM = opts?.paymasterMiddleware
            ? base.useMiddleware(opts.paymasterMiddleware)
            : base.useMiddleware(Presets.Middleware.estimateUserOperationGas(instance.provider))

        return withPM.useMiddleware(P256Signature(instance.signer))
    }

    execute(to: string, value: ethers.BigNumberish, data: ethers.BytesLike) {
        return this.setCallData(
            this.proxy.interface.encodeFunctionData("execute", [to, value, data])
        )
    }

    executeBatch(
        to: Array<string>,
        values: Array<ethers.BigNumberish>,
        data: Array<ethers.BytesLike>
    ) {
        return this.setCallData(
            this.proxy.interface.encodeFunctionData("executeBatch", [to, values, data])
        )
    }
}
