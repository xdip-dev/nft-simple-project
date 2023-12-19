import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IMyBeautyNftConstructor } from "../utils/helper-config";
import { getLastBlockTime, changeFutureTime } from "../utils/changeFutureTime";
import { MyBeautyNft } from "../typechain-types/contracts/MyBeautyNft";

describe("My Beauty NFT", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function MyBeautyFixture() {
        const currentTimestampInSeconds = Math.round(Date.now() / 1000);
        // const presaleStartTime = currentTimestampInSeconds + 60;
        // const presaleEndTime = currentTimestampInSeconds + 120;
        // const publicStartTime = currentTimestampInSeconds + 120;
        const constructorArgs: IMyBeautyNftConstructor = {
            nftBaseURI: "https://ip",
            claimFoundAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            publicSaleStartTime: currentTimestampInSeconds + 300,
            preSaleStartTime: currentTimestampInSeconds + 150,
            preSaleEndTime: currentTimestampInSeconds + 300,
        };

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MyBeautyNft = await ethers.getContractFactory("MyBeautyNft");
        const myBeauty = await MyBeautyNft.deploy(
            constructorArgs.nftBaseURI,
            constructorArgs.claimFoundAddress,
            constructorArgs.publicSaleStartTime,
            constructorArgs.preSaleStartTime,
            constructorArgs.preSaleEndTime
        );
        const myBeautyContract = myBeauty as unknown as MyBeautyNft;

        return { myBeautyContract, constructorArgs, owner, otherAccount, currentTimestampInSeconds };
    }
    describe("Deployment", function () {
        it("Should check the constructor information was set", async function () {
            const { myBeautyContract, owner, currentTimestampInSeconds } = await loadFixture(MyBeautyFixture);
            expect(await myBeautyContract.owner()).to.equal(owner.address);
            expect(await myBeautyContract.nftBaseURI()).to.equal("https://ip");
            expect(await myBeautyContract.claimFoundAddress()).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(await myBeautyContract.publicSaleStartTime()).to.equal(currentTimestampInSeconds + 300);
            expect(await myBeautyContract.preSaleStartTime()).to.equal(currentTimestampInSeconds + 150);
            expect(await myBeautyContract.preSaleEndTime()).to.equal(currentTimestampInSeconds + 300);
        });
    });
    describe("Presale", function () {
        describe("Assertion requirement", function () {
            it("Should check the presale is not open", async function () {
                const { myBeautyContract, otherAccount } = await loadFixture(MyBeautyFixture);
                await expect(myBeautyContract.connect(otherAccount).presale(1)).to.be.revertedWith(
                    "Presale is not ready or closed"
                );
            });
            it("should revert if the presale is closed", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                await expect(myBeautyContract.connect(otherAccount).presale(1)).to.be.revertedWith(
                    "Presale is not ready or closed"
                );
            });
            it("Should revert because not allowed in the preSale", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await expect(myBeautyContract.connect(otherAccount).presale(1)).to.be.revertedWith(
                    "You are not on the presale list"
                );
            });
            it("should revert because only the owner can add to the prelist", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await expect(
                    myBeautyContract.connect(otherAccount).addToPreSaleList([otherAccount.address])
                ).to.be.revertedWithCustomError(myBeautyContract, "OwnableUnauthorizedAccount");
            });
            it("should revert because > at the presaleList Maximum item", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await myBeautyContract.addToPreSaleList([otherAccount.address]);
                await expect(myBeautyContract.connect(otherAccount).presale(3)).to.be.revertedWith(
                    "You purchase exeeded max presale"
                );
            });
            it("Not enough found should revert", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await myBeautyContract.addToPreSaleList([otherAccount.address]);
                await expect(myBeautyContract.connect(otherAccount).presale(1)).to.be.revertedWith(
                    "You didnt send enough ether to purchase a beauty"
                );
            });
            it("should revert because the max supply was reached before", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await myBeautyContract.addToPreSaleList([otherAccount.address]);
                await myBeautyContract.setMaxSupply(0);

                await expect(
                    myBeautyContract.connect(otherAccount).presale(1, { value: ethers.parseEther("0.01") })
                ).to.be.revertedWith("Exceeds maximum supply");
            });
        });
        describe("Presale check working flow", function () {
            it("Should controle the PreSale flow in case of any revertion", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 160);
                await myBeautyContract.addToPreSaleList([otherAccount.address]);
                await expect(myBeautyContract.connect(otherAccount).presale(1, { value: ethers.parseEther("0.01") }))
                    .to.emit(myBeautyContract, "Presale")
                    .withArgs(1, otherAccount.address);
                expect(await myBeautyContract.preSaleListClaimed(otherAccount.address)).to.be.equal(1);
                const balanceOfuser = await myBeautyContract.balanceOf(otherAccount.address);
                expect(balanceOfuser).to.be.equal(1);
            });
        });
    });
    describe("Public sale", function () {
        describe("Assertion requirement", function () {
            it("Should check the public sale is not open", async function () {
                const { myBeautyContract, otherAccount } = await loadFixture(MyBeautyFixture);
                await expect(myBeautyContract.connect(otherAccount).mint(1)).to.be.revertedWith(
                    "Public sale is not active"
                );
            });
            it("should revert exceeding the max supply", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                await myBeautyContract.setMaxSupply(0);
                await expect(myBeautyContract.connect(otherAccount).mint(1)).to.be.revertedWith(
                    "Exceeds maximum supply"
                );
            });
            it("should revert for a mint <1", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                await expect(myBeautyContract.connect(otherAccount).mint(0)).to.be.revertedWith(
                    "You need to mint at least 1 beauty"
                );
            });
            it("should revert for a mint >10", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                await expect(myBeautyContract.connect(otherAccount).mint(11)).to.be.revertedWith(
                    "You max the mint limit"
                );
            });
            it("revert missing value", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                await expect(myBeautyContract.connect(otherAccount).mint(1)).to.be.revertedWith(
                    "You didnt send enough ether to purchase a beauty"
                );
            });
        });
        describe("Public sale check working flow", function () {
            it("Should controle the PublicSale flow in case of any revertion", async function () {
                const { myBeautyContract, otherAccount, currentTimestampInSeconds } = await loadFixture(
                    MyBeautyFixture
                );
                await changeFutureTime(currentTimestampInSeconds + 310);
                // const tx = ;
                await expect(myBeautyContract.connect(otherAccount).mint(1, { value: ethers.parseEther("0.01") }))
                    .to.emit(myBeautyContract, "Mint")
                    .withArgs(1, otherAccount.address);
                const balanceOfuser = await myBeautyContract.balanceOf(otherAccount.address);
                expect(balanceOfuser).to.be.equal(1);
            });
        });
    });

    describe("Claim", function () {
        it("Revert Not found to claim", async function () {
            const { myBeautyContract } = await loadFixture(MyBeautyFixture);
            // const tx = ;
            await expect(myBeautyContract.withdraw()).to.be.revertedWith("No funds to withdraw");
        });
        it("Should return to the owner the found", async function () {
            const { myBeautyContract, otherAccount, owner, currentTimestampInSeconds } = await loadFixture(
                MyBeautyFixture
            );
            await changeFutureTime(currentTimestampInSeconds + 310);
            // const tx = ;
            await myBeautyContract.connect(otherAccount).mint(1, { value: ethers.parseEther("0.01") });
            await expect(myBeautyContract.withdraw())
                .to.emit(myBeautyContract, "WithdrawFound")
                .withArgs(ethers.parseEther("0.01"), owner.address);
        });
    });
});
