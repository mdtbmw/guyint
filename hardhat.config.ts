
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// USE NEXT_PUBLIC_ for variables that need to be accessed by the frontend
const INTUITION_RPC = process.env.NEXT_PUBLIC_INTUITION_RPC;
const INTUITION_CHAIN_ID = process.env.NEXT_PUBLIC_INTUITION_CHAIN_ID;

// DO NOT use NEXT_PUBLIC_ for sensitive keys. This is for backend/deployment only.
const INTUITION_DEPLOYER_PRIVATE_KEY = process.env.INTUITION_DEPLOYER_PRIVATE_KEY;


if (!INTUITION_RPC || !INTUITION_DEPLOYER_PRIVATE_KEY || !INTUITION_CHAIN_ID) {
  throw new Error(
    "Missing required environment variables for deployment. Please check your .env file for NEXT_PUBLIC_INTUITION_RPC, INTUITION_DEPLOYER_PRIVATE_KEY, and NEXT_PUBLIC_INTUITION_CHAIN_ID."
  );
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    intuition: {
      url: INTUITION_RPC,
      accounts: [INTUITION_DEPLOYER_PRIVATE_KEY],
      chainId: parseInt(INTUITION_CHAIN_ID)
    },
  },
  etherscan: {
    apiKey: {
      intuition: "anything" // API key is not required for local block explorer
    },
    customChains: [
      {
        network: "intuition",
        chainId: parseInt(INTUITION_CHAIN_ID),
        urls: {
          apiURL: "https://explorer.intuition.systems/api",
          browserURL: "https://explorer.intuition.systems"
        }
      }
    ]
  },
  typechain: {
    outDir: "src/types/contracts",
    target: "ethers-v6"
  }
};

export default config;
