import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy } = deployments

    const entryPoint = await ethers.getContract("EntryPoint")

    const paymaster = await deploy("VerifyingPaymaster", {
        from: deployer,
        args: [entryPoint.address, deployer],
        log: true,
        deterministicDeployment: true,
    })

    if (paymaster.newlyDeployed) {
        console.log(`Staking gas ...`)
        await entryPoint.depositTo(paymaster.address, { value: ethers.utils.parseEther("10") })
    }
}

deploy.tags = ["VerifyingPaymaster", "paymaster"]
deploy.dependencies = ["entrypoint"]
export default deploy
