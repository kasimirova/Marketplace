import * as conf from "../config";
import { task } from "hardhat/config";

task("makeBid", "Make bid")
    .addParam("tokenid", "Token's id")
    .addParam("price", "Price")
    .setAction(async (taskArgs, { ethers }) => {
    let ERC20 = await ethers.getContractAt("ERC20", conf.ERC20_ADDRESS);
    ERC20.approve(conf.CONTRACT_ADDRESS, taskArgs.price);
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    await Marketplace.makeBid(taskArgs.tokenid, taskArgs.price);
  });
