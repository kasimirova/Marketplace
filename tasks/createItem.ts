import * as conf from "../config";
import { task } from "hardhat/config";

task("createItem", "Create item")
    .addParam("tokenuri", "Token URI")
    .addParam("owner", "Token's owner")
    .setAction(async (taskArgs, { ethers }) => {
    let NFT = await ethers.getContractAt("NFT", conf.NFT_ADDRESS);
    let MINTER_ROLE = await NFT.MINTER_ROLE();
    await NFT.grantRole(MINTER_ROLE, conf.CONTRACT_ADDRESS);
    
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    await Marketplace.createItem(taskArgs.tokenuri, taskArgs.owner);
  });
