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

export const developmentChains: string[] = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
