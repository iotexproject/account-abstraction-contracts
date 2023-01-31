import { BigNumber } from "ethers"

type NetworkConfigItem = {
    name: string
}

type NetworkConfigMap = {
    [chainId: string]: NetworkConfigItem
}

export const networkConfig: NetworkConfigMap = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    1: {
        name: "mainnet",
    },
    5: {
        name: "goerli",
    },
    137: {
        name: "polygon",
    },
}

export const deterministicInfo = {
    4689: {
        gasPrice: 1000000000000,
        gasLimit: 100000,
        signerAddress: "0xDF0BcE43C0ADc06CD0545E676da9c59f00b55F9B",
        transaction:
            "0xf8a78085e8d4a51000830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf38224c5a0a3c9008f3426b5c46093e0e478b3dcbd3adc7da079ba7e15aee7d1b51d1bb21da015e3cb3214bc1f9a6efabb4ad5c98ecd073a098afaa6a4fb217a57a81a7f995c",
        address: "0x355BE1cbfFBf803fdb17E0CB207D051cD9816916",
    },
    4690: {
        gasPrice: 1000000000000,
        gasLimit: 100000,
        signerAddress: "0xDF0BcE43C0ADc06CD0545E676da9c59f00b55F9B",
        transaction:
            "0xf8a78085e8d4a51000830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf38224c8a05892db0b1697fa0a0e411b1e5b585410ba47759e7d9d37b41cfab3e248dc3892a060874f9f44ecb166e408fc99cc9cac88ec9ba43b3140cfd6e9d318e1456c0c6e",
        address: "0x355BE1cbfFBf803fdb17E0CB207D051cD9816916",
    },
}

export const developmentChains: string[] = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
