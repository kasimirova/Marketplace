import * as conf from "../config";
import { task } from "hardhat/config";

task("buyItem", "Buy item")
    .addParam("tokenid", "Token's id")
    .setAction(async (taskArgs, { ethers }) => {
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    let ERC20 = await ethers.getContractAt("ERC20", conf.ERC20_ADDRESS);
    await ERC20.approve(conf.CONTRACT_ADDRESS, await Marketplace.getItemsPrice(taskArgs.tokenid));
    await Marketplace.buyItem(taskArgs.tokenid);
  });
