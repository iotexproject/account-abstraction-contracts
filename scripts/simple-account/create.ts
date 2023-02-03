import { ethers } from "hardhat"
import { SimpleAccountFactory } from "../../typechain/contracts/samples/SimpleAccountFactory"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory

    const owner = new ethers.Wallet(process.env.OWNER!)
    const bundler = new ethers.Wallet(process.env.BUNDLER!, ethers.provider)

    await factory.connect(bundler).createAccount(owner.address, 0)
    const account = await factory.getAddress(owner.address, 0)

    console.log(`created account ${account}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
