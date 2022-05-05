const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
let Marketplace : Contract, marketplace : Contract, erc20 : Contract, ERC20 : Contract, nft : Contract, NFT : Contract;
let owner:SignerWithAddress, addr1:SignerWithAddress, addr2:SignerWithAddress, addr3:SignerWithAddress, addr4:SignerWithAddress, provider:any;

describe("Marketplace", function () {
  before(async function () 
  {
    ERC20 = await ethers.getContractFactory("ERC20");
    erc20 = await ERC20.deploy("Cabbage", "Cbg", 18, ethers.utils.parseEther("10000"));
    await erc20.deployed();

    NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy("Carrot", "Crt");
    await nft.deployed();

    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(nft.address, erc20.address, 4, 1200);
    await marketplace.deployed();
    let MINTER_ROLE = await nft.MINTER_ROLE();
    nft.grantRole(MINTER_ROLE, marketplace.address);

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    erc20.transfer(addr1.address, ethers.utils.parseEther("100"));
    erc20.transfer(addr2.address, ethers.utils.parseEther("100"));
    erc20.transfer(addr3.address, ethers.utils.parseEther("100"));
    erc20.transfer(addr4.address, ethers.utils.parseEther("100"));
    provider = waffle.provider;
  });

  it("Should create an item", async function () {
    expect(await marketplace.getItemsState(0)).to.equal(0);    
    await marketplace.createItem("ipfs://someuri/", addr1.address);
    await marketplace.createItem("ipfs://someuri/", addr2.address);
    await marketplace.createItem("ipfs://someuri/", addr1.address);
    expect(await marketplace.getItemsState(0)).to.equal(1); 
    expect(await nft.tokenURI(0)).to.equal("ipfs://someuri/0.json"); 
    expect(await nft.tokenURI(1)).to.equal("ipfs://someuri/1.json"); 
  }
  );

  it("Should list an item", async function () {
    expect(await marketplace.getItemsState(0)).to.equal(1);    
    await nft.connect(addr1).approve(marketplace.address, 0);
    await marketplace.connect(addr1).listItem(0, ethers.utils.parseEther("20"));
    expect(await marketplace.getItemsState(0)).to.equal(2);
    expect(await marketplace.getItemsPrice(0)).to.equal(ethers.utils.parseEther("20"));

  }
  );

  it("Should cancel successfully and list again", async function () {
    await marketplace.cancel(0);
    expect(await marketplace.getItemsState(0)).to.equal(1); 
    await nft.connect(addr1).approve(marketplace.address, 0);
    await marketplace.connect(addr1).listItem(0, ethers.utils.parseEther("20"));
    expect(await marketplace.getItemsState(0)).to.equal(2);    
  }
  );

  it("Should buy an item", async function () {
    await erc20.connect(addr2).approve(marketplace.address, ethers.utils.parseEther("20"))
    await marketplace.connect(addr2).buyItem(0);
    expect(await marketplace.getItemsState(0)).to.equal(1);
    expect(await marketplace.getItemsOwner(0)).to.equal(addr2.address);    
  }
  );
  
  it("Shouldn't cancel an item after buying one", async function () {
    await expect(marketplace.cancel(0)).to.be.revertedWith("Item's not on market");
  }
  );

  it("Should list an item on auction", async function () {
    await nft.connect(addr2).approve(marketplace.address, 1);
    await nft.connect(addr1).approve(marketplace.address, 2);
    await marketplace.connect(addr2).listItemOnAuction(1, ethers.utils.parseEther("10"));
    await marketplace.connect(addr1).listItemOnAuction(2, ethers.utils.parseEther("12"));

    expect(await marketplace.getItemsState(1)).to.equal(3);    
  }
  );

  it("Shouldn't list an item on auction if it's already on auction", async function () {
    await expect(marketplace.connect(addr2).listItemOnAuction(1, ethers.utils.parseEther("10"))).to.be.revertedWith("Item's on market");
  }
  );

  it("Shouldn't make a bid with lower price", async function () {
    await erc20.connect(addr1).approve(marketplace.address, ethers.utils.parseEther("9"));
    await expect(marketplace.connect(addr1).makeBid(1, ethers.utils.parseEther("9"))).to.be.revertedWith("Price's too low");
  }
  );

  it("Shouldn't make a bid if item's not on auction", async function () {
    await erc20.connect(addr1).approve(marketplace.address, ethers.utils.parseEther("11"));
    await expect(marketplace.connect(addr1).makeBid(0, ethers.utils.parseEther("11"))).to.be.revertedWith("Item's not on auction");
  }
  );

  it("Should make a bid", async function () {
    await erc20.connect(addr3).approve(marketplace.address, ethers.utils.parseEther("23"));
    await marketplace.connect(addr1).makeBid(1, ethers.utils.parseEther("20"));
    let balanceBefore = await erc20.balanceOf(addr1.address);
    await marketplace.connect(addr3).makeBid(1, ethers.utils.parseEther("23"));
    await expect((await erc20.balanceOf(addr1.address)-balanceBefore).toString()).to.equal(ethers.utils.parseEther("20").toString());    
    expect(await marketplace.getItemsState(1)).to.equal(3);    
  }
  );

  it("Shouldn't finish an auction earlier", async function () {
    await expect(marketplace.finishAuction(1)).to.be.revertedWith("Too soon to close this auction");
  }
  );

  it("Should finish an auction with 2 bids", async function () {
    await provider.send("evm_increaseTime", [1250]);
    await provider.send("evm_mine");
    await marketplace.finishAuction(1);
    expect(await erc20.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther("100"));     
    expect(await nft.balanceOf(addr2.address)).to.equal(2); 
    expect(await marketplace.getItemsOwner(1)).to.equal(addr2.address);    
  }
  );

  it("Should set duration of auction from an owner", async function () {
    await marketplace.setDurationForAuction(1800);   
  }
  );

  it("Shouldn't set duration of auction from not an owner", async function () {
    await expect(marketplace.connect(addr1).setDurationForAuction(3000)).to.be.reverted;
  }
  );

  it("Should set min amount of bids from an owner", async function () {
    await marketplace.setMinAmountOfBids(3);   
  }
  );

  it("Shouldn't set min amount of bids from not an owner", async function () {
    await expect(marketplace.connect(addr1).setMinAmountOfBids(5)).to.be.reverted;
  }
  );

  it("Should make 3 bids and finish auction", async function () {
    await erc20.connect(addr2).approve(marketplace.address, ethers.utils.parseEther("15"));
    await marketplace.connect(addr2).makeBid(2, ethers.utils.parseEther("15"));

    await erc20.connect(addr3).approve(marketplace.address, ethers.utils.parseEther("17"));
    await marketplace.connect(addr3).makeBid(2, ethers.utils.parseEther("17"));

    await erc20.connect(addr4).approve(marketplace.address, ethers.utils.parseEther("21"));
    await marketplace.connect(addr4).makeBid(2, ethers.utils.parseEther("21"));
   
    await provider.send("evm_increaseTime", [600]);
    await provider.send("evm_mine");

    await marketplace.finishAuction(2);

    expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("141"));     
    expect(await nft.balanceOf(addr4.address)).to.equal(1); 
    expect(await marketplace.getItemsOwner(2)).to.equal(addr4.address);  
  }
  );

});
