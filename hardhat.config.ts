import * as dotenv from "dotenv"

import type { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-chai-matchers"
import "hardhat-deploy"
import "hardhat-contract-sizer"
import "./tasks"
import { deterministicInfo } from "./helper-hardhat-config"
import { BigNumber } from "ethers"

dotenv.config()

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://babel-api.mainnet.iotex.io"
const TESTNET_RPC_URL = process.env.TESTNET_RPC_URL || "https://babel-api.testnet.iotex.io"

const PRIVATE_KEY = process.env.PRIVATE_KEY
// optional
const MNEMONIC = process.env.MNEMONIC || "Your mnemonic"
const FORKING_BLOCK_NUMBER = process.env.FORKING_BLOCK_NUMBER

const accounts = PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : []
// const accounts = {
//     mnemonic: MNEMONIC,
// }

const deterministicDeployment = (network: string) => {
    const info = deterministicInfo[parseInt(network)]
    if (!info) {
        throw new Error(`
        Safe factory not found for network ${network}. You can request a new deployment at https://github.com/safe-global/safe-singleton-factory.
        For more information, see https://github.com/safe-global/safe-contracts#replay-protection-eip-155
      `)
    }

    return {
        factory: info.address,
        deployer: info.signerAddress,
        funding: BigNumber.from(info.gasLimit).mul(BigNumber.from(info.gasPrice)).toString(),
        signedTx: info.transaction,
    }
}

const optimizedComilerSettings = {
    version: "0.8.19",
    settings: {
        optimizer: { enabled: true, runs: 1000000 },
        viaIR: true,
    },
}

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // If you want to do some forking set `enabled` to true
            forking: {
                url: MAINNET_RPC_URL,
                blockNumber: Number(FORKING_BLOCK_NUMBER),
                enabled: false,
            },
            chainId: 31337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: accounts,
        },
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: accounts,
            saveDeployments: true,
            chainId: 4689,
        },
        testnet: {
            url: TESTNET_RPC_URL,
            accounts: accounts,
            saveDeployments: true,
            chainId: 4690,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    contractSizer: {
        runOnCompile: false,
        only: ["DIDRegistry"],
    },
    deterministicDeployment,
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        admin: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.19",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                },
            },
        ],
        overrides: {
            "contracts/core/EntryPoint.sol": optimizedComilerSettings,
            "contracts/samples/SimpleAccount.sol": optimizedComilerSettings,
        },
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
}

export default config
