require("@nomiclabs/hardhat-ethers");
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337
    },
    // Add testnet (Berachain testnet) RPC if you have one:
    // beraTestnet: {
    //   url: process.env.BERA_RPC,
    //   accounts: process.env.DEPLOYER ? [process.env.DEPLOYER] : []
    // }
  }
};

