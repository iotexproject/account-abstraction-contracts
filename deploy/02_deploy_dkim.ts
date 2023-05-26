import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy } = deployments

    const keys = await deploy("DkimKeys", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })

    await deploy("DkimVerifier", {
        from: deployer,
        args: [keys.address],
        log: true,
        deterministicDeployment: false,
    })

    await deploy("SimpleEmailGuardian", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
    })
}

deploy.tags = ["dkim", "utils"]
export default deploy
