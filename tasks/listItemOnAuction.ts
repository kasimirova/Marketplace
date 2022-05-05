import * as conf from "../config";
import { task } from "hardhat/config";

task("listItemOnAuction", "Create item")
    .addParam("tokenid", "Token's id")
    .addParam("minprice", "Min price")
    .setAction(async (taskArgs, { ethers }) => {
    let NFT = await ethers.getContractAt("NFT", conf.NFT_ADDRESS);
    NFT.approve(conf.CONTRACT_ADDRESS, taskArgs.tokenid);
    
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    await Marketplace.listItemOnAuction(taskArgs.tokenid, taskArgs.minprice);
  });
