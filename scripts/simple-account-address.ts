import { ethers } from "hardhat"

import { SimpleAccountFactory } from "../typechain/contracts/samples/SimpleAccountFactory"

async function main() {
    const factory = (await ethers.getContract("SimpleAccountFactory")) as SimpleAccountFactory

    const owner = new ethers.Wallet(process.env.OWNER!)

    const address = await factory.getAddress(owner.address, 2)

    console.log(`${owner.address} owned account address: ${address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
