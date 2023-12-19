// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SalesActivation is Ownable {
    uint256 public publicSaleStartTime;
    uint256 public preSaleStartTime;
    uint256 public preSaleEndTime;

    constructor(
        uint256 _publicSaleStartTime,
        uint256 _preSaleStartTime,
        uint256 _preSaleEndTime
    ) Ownable(msg.sender) {
        publicSaleStartTime = _publicSaleStartTime;
        preSaleStartTime = _preSaleStartTime;
        preSaleEndTime = _preSaleEndTime;
    }

    modifier isPublicSaleActive() {
        require(isPublicSaleActiveCheck(), "Public sale is not active");
        _;
    }

    function isPublicSaleActiveCheck() public view returns (bool) {
        return
            publicSaleStartTime > 0 && block.timestamp >= publicSaleStartTime;
    }

    modifier isPreSaleActive() {
        require(isPreSaleActiveCheck(), "Presale is not ready or closed");
        _;
    }

    function isPreSaleActiveCheck() public view returns (bool) {
        return
            preSaleStartTime > 0 &&
            block.timestamp >= preSaleStartTime &&
            block.timestamp <= preSaleEndTime;
    }

    function setPublicSaleStartTime(
        uint256 _publicSaleStartTime
    ) external onlyOwner {
        publicSaleStartTime = _publicSaleStartTime;
    }

    function setPreSaleTime(
        uint256 _preSaleStartTime,
        uint256 _preSaleEndTime
    ) external onlyOwner {
        preSaleStartTime = _preSaleStartTime;
        preSaleEndTime = _preSaleEndTime;
    }
}
