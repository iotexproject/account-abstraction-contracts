import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy } = deployments

    const entryPoint = await ethers.getContract("EntryPoint")

    await deploy("SimpleAccountFactory", {
        from: deployer,
        args: [entryPoint.address],
        log: true,
        deterministicDeployment: true,
    })
}

deploy.tags = ["simple_factory", "sample"]
deploy.dependencies = ["entrypoint"]
export default deploy
