import * as conf from "../config";
import { task } from "hardhat/config";

task("finishAuction", "Finish auction")
    .addParam("tokenid", "Token's id")
    .setAction(async (taskArgs, { ethers }) => {
    let Marketplace = await ethers.getContractAt("Marketplace", conf.CONTRACT_ADDRESS);
    await Marketplace.finishAuction(taskArgs.tokenid);
  });
