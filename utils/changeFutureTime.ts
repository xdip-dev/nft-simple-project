import { network } from "hardhat";

export const changeFutureTime = async (time: number) => {
    network.provider.send("evm_setNextBlockTimestamp", [time]);
    network.provider.send("evm_mine");
};

export const getLastBlockTime = async () => {
    const block = await network.provider.send("eth_getBlockByNumber", ["latest", false]);
    return parseInt(block.timestamp, 16);
};
