//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC721.sol";

contract Marketplace is AccessControl{
    enum States { DOESNTEXIST, EXISTS, ONMARKET, ONAUCTION }
    struct Item{
        uint256 NFTTokenId;
        uint256 price;
        uint256 currentPriceOnAuction;
        uint256 amountOfBids;  
        uint256 startOfAuction;  
        address owner;
        address lastBidder;
        States currentState;
    }
    mapping (uint => Item) itemsInfo;
    address NFTToken;
    address ERC20Token;
    uint256 minAmountOfBids;
    uint256 durationOfAuction;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    modifier stateOnAuction(uint256 tokenId){
         require(itemsInfo[tokenId].currentState == States.ONAUCTION, "Item's not on auction");
         _;
    }

    modifier stateExists(uint256 tokenId){
         require(itemsInfo[tokenId].currentState == States.EXISTS, "Item's on market or on auction or doesn't exist");
         _;
    }

    modifier stateOnMarket(uint256 tokenId){
        require(itemsInfo[tokenId].currentState == States.ONMARKET, "Item's not on market");
         _;
    }

    constructor(address _NFTToken, address _ERC20Token, uint256 _minAmountOfBids, uint256 _durationOfAuction) {
        _grantRole(ADMIN_ROLE, msg.sender);
        NFTToken = _NFTToken;
        ERC20Token = _ERC20Token;
        minAmountOfBids = _minAmountOfBids;
        durationOfAuction = _durationOfAuction;
    }

    function createItem(string memory tokenURI, address owner) external {
        uint256 currId = IERC721(NFTToken).getID();
        IERC721(NFTToken).safeMint(owner);
        itemsInfo[currId].currentState = States.EXISTS;
        itemsInfo[currId].owner = owner;
        IERC721(NFTToken).setBaseTokenURI(tokenURI);
    }

    function listItem(uint256 tokenId, uint256 _price) external stateExists(tokenId){
        IERC721(NFTToken).transferFrom(msg.sender, address(this), tokenId);
        itemsInfo[tokenId].price = _price;
        itemsInfo[tokenId].currentState = States.ONMARKET;
    }

    function cancel(uint256 tokenId) external stateOnMarket(tokenId){
        IERC721(NFTToken).transferFrom(address(this), itemsInfo[tokenId].owner, tokenId);
        itemsInfo[tokenId].currentState = States.EXISTS;
    }

    function buyItem(uint256 tokenId) external stateOnMarket(tokenId){
        IERC20(ERC20Token).transferFrom(msg.sender, itemsInfo[tokenId].owner, itemsInfo[tokenId].price);
        IERC721(NFTToken).transferFrom(address(this), msg.sender, tokenId);
        itemsInfo[tokenId].owner = msg.sender; 
        itemsInfo[tokenId].currentState = States.EXISTS;
    }

    function listItemOnAuction(uint256 tokenId, uint256 minPrice) external stateExists(tokenId){
        itemsInfo[tokenId].currentState = States.ONAUCTION;
        itemsInfo[tokenId].startOfAuction = block.timestamp;
        itemsInfo[tokenId].currentPriceOnAuction = minPrice;
        IERC721(NFTToken).transferFrom(msg.sender, address(this), tokenId);
    }

    function makeBid(uint256 tokenId, uint256 price) external stateOnAuction(tokenId){
        require(itemsInfo[tokenId].currentPriceOnAuction < price, "Price's too low");
        if (itemsInfo[tokenId].amountOfBids != 0){ // if it's not a first bid
            IERC20(ERC20Token).transfer(itemsInfo[tokenId].lastBidder, itemsInfo[tokenId].currentPriceOnAuction); // return money to the previous bidder
        }
        IERC20(ERC20Token).transferFrom(msg.sender, address(this), price);
        itemsInfo[tokenId].currentPriceOnAuction = price;
        itemsInfo[tokenId].amountOfBids++;
        itemsInfo[tokenId].lastBidder = msg.sender;
    }

    function finishAuction(uint256 tokenId) external stateOnAuction(tokenId){
        require(block.timestamp - itemsInfo[tokenId].startOfAuction >= durationOfAuction, "Too soon to close this auction");
        if (itemsInfo[tokenId].amountOfBids < minAmountOfBids){
            IERC20(ERC20Token).transfer(itemsInfo[tokenId].lastBidder, itemsInfo[tokenId].currentPriceOnAuction);
            IERC721(NFTToken).transferFrom(address(this), itemsInfo[tokenId].owner, tokenId);
        }
        else{
            IERC721(NFTToken).transferFrom(address(this), itemsInfo[tokenId].lastBidder, tokenId);
            IERC20(ERC20Token).transfer(itemsInfo[tokenId].owner, itemsInfo[tokenId].currentPriceOnAuction);
            itemsInfo[tokenId].owner = itemsInfo[tokenId].lastBidder; 
        }
        itemsInfo[tokenId].currentState = States.EXISTS;
        itemsInfo[tokenId].amountOfBids = 0;
    }

    function getItemsPrice(uint256 tokenId) external view returns (uint256){
        return itemsInfo[tokenId].price;
    }

    function getItemsState(uint256 tokenId) external view returns (States){
        return itemsInfo[tokenId].currentState;
    }

    function getItemsOwner(uint256 tokenId) external view returns (address){
        return itemsInfo[tokenId].owner;
    }

    function setDurationForAuction(uint256 newDuration) external onlyRole(ADMIN_ROLE){
        durationOfAuction = newDuration;
    }

    function setMinAmountOfBids(uint256 newAmount) external onlyRole(ADMIN_ROLE){
        minAmountOfBids = newAmount;
    }
}
