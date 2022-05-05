import * as conf from "../config";
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


task("listItem", "List item")
    .addParam("tokenid", "Token's id")
    .addParam("price", "Token's price")
    .setAction(async (taskArgs, { ethers }) => {
    let NFT = await ethers.getContractAt("NFT", conf.NFT_ADDRESS);
    await NFT.approve(conf.CONTRACT_ADDRESS, taskArgs.tokenid);
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    await Marketplace.listItem(taskArgs.tokenid, taskArgs.price);
  });
