//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFT is ERC721, AccessControl{

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 id;
    string baseURI = "ipfs://QmT2x1sMoMZyoT1iNVB2JgtBaANquFQz2vPK3mTfsqeaC3/";

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    function safeMint(address to) public onlyRole(MINTER_ROLE) {
        _safeMint(to, id);
        id += 1;
    }

    function burn(uint256 tokenId) public onlyRole(BURNER_ROLE) {
        _burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        return string (abi.encodePacked(
        baseTokenURI(),
        Strings.toString(tokenId),
        ".json"
        ));
    }

    function setBaseTokenURI(string memory newuri) public{
        baseURI=newuri;
    }

    function baseTokenURI() public view returns (string memory) {
        return baseURI;
    }

    function getID() public view returns (uint256) {
        return id;
    }
}
