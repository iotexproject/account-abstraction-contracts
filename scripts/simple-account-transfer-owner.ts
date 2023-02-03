import { ethers } from "hardhat"
import { SimpleAccountFactory } from "../typechain/contracts/samples/SimpleAccountFactory"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory
    const accountTemp = await ethers.getContractFactory("SimpleAccount")

    const owner = new ethers.Wallet(process.env.OWNER!, ethers.provider)

    const account = await factory.getAddress(owner.address, 0)

    const accountContract = accountTemp.attach(account)

    const tx = await accountContract
        .connect(owner)
        .execute("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 100, "0x")

    console.log(`transfer tx: ${tx.hash}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
