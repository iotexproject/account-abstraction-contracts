import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const { deploy } = deployments

    const validator = await deploy("Secp256r1", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true,
    })

    const entryPoint = await ethers.getContract("EntryPoint")
    const dkimVerifier = await ethers.getContract("DkimVerifier")
    const emailGauddian = await ethers.getContract("SimpleEmailGuardian")

    await deploy("P256AccountFactory", {
        from: deployer,
        args: [entryPoint.address, validator.address, dkimVerifier.address, emailGauddian.address],
        log: true,
        deterministicDeployment: true,
    })
}

deploy.tags = ["p256_factory", "p256", "account"]
deploy.dependencies = ["entrypoint", "dkim"]
export default deploy
