// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SalesActivation.sol";

contract MyBeautyNft is ERC721, ERC721Enumerable, Ownable, SalesActivation {
    uint256 public price = 0.01 ether;
    uint256 public maxSupply = 100;
    uint256 public preSaleListMax = 2;
    address public claimFoundAddress;
    string public nftBaseURI;
    mapping(address => bool) public preSaleList;
    mapping(address => uint256) public preSaleListClaimed;

    event Presale(uint256 qty, address indexed _buyer);
    event Mint(uint256 qty, address indexed _buyer);
    event WithdrawFound(uint256 amount, address indexed _to);

    constructor(
        string memory _nftBaseURI,
        address _claimFoundAddress,
        uint256 _publicSaleStartTime,
        uint256 _preSaleStartTime,
        uint256 _preSaleEndTime
    )
        ERC721("MyBeautyNftX", "MBX")
        SalesActivation(
            _publicSaleStartTime,
            _preSaleStartTime,
            _preSaleEndTime
        )
    {
        nftBaseURI = _nftBaseURI;
        claimFoundAddress = _claimFoundAddress;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        // Transfer the contract's Ether balance to the claimFoundAddress
        (bool sent, ) = claimFoundAddress.call{value: balance}("");
        require(sent, "Failed to send Ether");
        emit WithdrawFound(balance, claimFoundAddress);
    }

    function presale(uint256 _beautyNumber) external payable isPreSaleActive {
        uint256 supply = totalSupply();
        require(tx.origin == msg.sender, "No contracts");
        require(preSaleList[msg.sender], "You are not on the presale list");
        require(
            preSaleListClaimed[msg.sender] + _beautyNumber <= preSaleListMax,
            "You purchase exeeded max presale"
        );
        require(
            msg.value >= price * _beautyNumber,
            "You didnt send enough ether to purchase a beauty"
        );
        require(supply + _beautyNumber <= maxSupply, "Exceeds maximum supply");

        for (uint256 i = 0; i < _beautyNumber; i++) {
            preSaleListClaimed[msg.sender]++;
            _safeMint(msg.sender, supply + i);
        }
        emit Presale(_beautyNumber, msg.sender);
    }

    function mint(uint256 _beautyNumber) external payable isPublicSaleActive {
        uint256 supply = totalSupply();
        require(supply + _beautyNumber <= maxSupply, "Exceeds maximum supply");
        require(tx.origin == msg.sender, "No contracts");
        require(_beautyNumber > 0, "You need to mint at least 1 beauty");
        require(_beautyNumber < 10, "You max the mint limit");
        require(
            msg.value >= price * _beautyNumber,
            "You didnt send enough ether to purchase a beauty"
        );

        for (uint256 i = 0; i < _beautyNumber; i++) {
            _safeMint(msg.sender, supply + i);
        }
        emit Mint(_beautyNumber, msg.sender);
    }

    function addToPreSaleList(
        address[] calldata _addresses
    ) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            preSaleList[_addresses[i]] = true;
        }
    }

    function removeFromPreSaleList(
        address[] calldata _addresses
    ) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            preSaleList[_addresses[i]] = false;
        }
    }

    function onPreSaleList(address _address) external view returns (bool) {
        return preSaleList[_address];
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
    }

    function setMaxSupply(uint256 _newMaxSupply) external onlyOwner {
        maxSupply = _newMaxSupply;
    }

    function setPreSaleListMax(uint256 _newPreSaleListMax) external onlyOwner {
        preSaleListMax = _newPreSaleListMax;
    }

    function setClaimFoundAddress(
        address _newClaimFoundAddress
    ) external onlyOwner {
        claimFoundAddress = _newClaimFoundAddress;
    }

    function setNftBaseURI(string calldata _newNftBaseURI) external onlyOwner {
        nftBaseURI = _newNftBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return nftBaseURI;
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
