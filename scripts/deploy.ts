import { ethers, network } from "hardhat";
import { networkConfigMyBeautyNft } from "../utils/helper-config";

async function main() {
    const chainId = network.config.chainId;
    const ownerAddress = (await ethers.getSigners())[0].address;
    console.log("Owner address: ", ownerAddress);

    const MyBeautyNft = await ethers.deployContract("MyBeautyNft", [
        networkConfigMyBeautyNft[chainId ?? 1337].nftBaseURI,
        networkConfigMyBeautyNft[chainId ?? 1337].claimFoundAddress,
        networkConfigMyBeautyNft[chainId ?? 1337].publicSaleStartTime,
        networkConfigMyBeautyNft[chainId ?? 1337].preSaleStartTime,
        networkConfigMyBeautyNft[chainId ?? 1337].preSaleEndTime,
    ]);

    await MyBeautyNft.waitForDeployment();

    console.log("MyBeautyNft deployed to: ", await MyBeautyNft.getAddress());

    if (chainId === 1337) {
        console.log("---Local setup---");
        const addToPreSaleListTx = await MyBeautyNft.addToPreSaleList([ownerAddress]);
        await addToPreSaleListTx.wait();
        console.log(await MyBeautyNft.onPreSaleList(ownerAddress));
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
