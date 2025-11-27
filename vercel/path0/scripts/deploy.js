
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const platformFeeBps = process.env.PLATFORM_FEE_BPS;
  const ownerAddress = (await hre.ethers.getSigners())[0].address;

  if (!treasuryAddress || !platformFeeBps) {
    console.error("\n❌ ERROR: TREASURY_ADDRESS and PLATFORM_FEE_BPS must be set in your .env file.");
    console.error("Please ensure your .env file is correctly configured before deploying.\n");
    process.exit(1);
  }

  console.log("\n====================================================================");
  console.log("   🚀  Starting Deployment of IntuitionBettingOracle...  🚀");
  console.log("====================================================================");
  console.log(`\n   Deployer Account: ${ownerAddress}`);
  console.log(`   Treasury Address: ${treasuryAddress}`);
  console.log(`   Platform Fee: ${platformFeeBps} BPS (${parseInt(platformFeeBps) / 100}%)`);
  console.log("\n   Contract factory loading...");

  const IntuitionBettingOracle = await hre.ethers.getContractFactory("IntuitionBettingOracle");
  console.log("   Contract factory loaded. Deploying with constructor arguments...");

  const contract = await IntuitionBettingOracle.deploy(ownerAddress, treasuryAddress, platformFeeBps);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log(`\n====================================================================`);
  console.log(`   ✅  IntuitionBettingOracle Deployed Successfully! ✅`);
  console.log(`====================================================================\n`);
  // The final line of output MUST be the address for the deploy.sh script to capture it.
  console.log(contractAddress);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exitCode = 1;
});

