
import { ethers } from "hardhat";
import * as conf from "../config";


async function main() {
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(conf.NFT_ADDRESS, conf.ERC20_ADDRESS, 2, 600);

  await marketplace.deployed();

  console.log("Marketplace deployed to:", marketplace.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });