export interface IMyBeautyNftConstructor {
    nftBaseURI: string;
    claimFoundAddress: string;
    publicSaleStartTime: number;
    preSaleStartTime: number;
    preSaleEndTime: number;
}

export const networkConfigMyBeautyNft: Record<number, IMyBeautyNftConstructor> = {
    1337: {
        nftBaseURI: "ipfs://QmRtrYG4BTFtTd5vngBnC3Mgho7DHYATPEzFYX6Vus47iz/",
        claimFoundAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        publicSaleStartTime: 1702999825,
        preSaleStartTime: 1702570230,
        preSaleEndTime: 1702999825,
    },
    80001: {
        nftBaseURI: "ipfs://QmRtrYG4BTFtTd5vngBnC3Mgho7DHYATPEzFYX6Vus47iz/",
        claimFoundAddress: "0x555dF0093d3692c54C70f2c0F59A6E6772317E1E",
        publicSaleStartTime: 1702590230,
        preSaleStartTime: 1702570230,
        preSaleEndTime: 1702580230,
    },
};
