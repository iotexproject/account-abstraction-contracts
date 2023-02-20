import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy } = deployments

    const validator = await deploy("BundlerHelper", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true,
    })
}

deploy.tags = ["misc", "bundler", "BundlerHelper"]
deploy.dependencies = ["entrypoint"]
export default deploy
