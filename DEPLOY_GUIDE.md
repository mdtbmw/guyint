# Intuition BETs - Deployment Guide

This document provides a comprehensive guide for deploying, verifying, and managing the Intuition BETs application.

## 1. Smart Contract Deployment

The core of the application is the `IntuitionBettingOracle` smart contract. This contract must be deployed to the target blockchain before the front-end application can be deployed.

### Command

The deployment is handled by a single script, which reads its configuration from your `.env` file.

```bash
npm run deploy:intuition
```

**What it does:**
- Compiles the smart contracts.
- Connects to the RPC endpoint defined by `NEXT_PUBLIC_INTUITION_RPC`.
- Uses the `INTUITION_DEPLOYER_PRIVATE_KEY` to sign and send the deployment transaction.
- Passes the `TREASURY_ADDRESS` and `PLATFORM_FEE_BPS` as constructor arguments to the contract.
- Upon success, it prints the newly deployed contract address to the console.

**CRITICAL NEXT STEP:** You **must** copy the outputted contract address and paste it into your `.env` file as the value for `NEXT_PUBLIC_INTUITION_BETTING_ADDRESS`.

## 2. Off-Chain to On-Chain Integration

This project's primary integration point is the smart contract itself. There are no separate off-chain assets like IPFS files that require pinning. The "integration" is ensuring the front-end application knows the correct contract address.

- **Smart Contract Address:** The `NEXT_PUBLIC_INTUITION_BETTING_ADDRESS` in your `.env` file is the link between the off-chain front-end and the on-chain logic. The one-click deploy script forces a verification of this step.
- **Contract Verification:** To make your contract source code readable on the block explorer, you can run the following Hardhat command after deployment:
  ```bash
  npx hardhat verify --network intuition YOUR_DEPLOYED_CONTRACT_ADDRESS "YOUR_OWNER_ADDRESS" "YOUR_TREASURY_ADDRESS" "YOUR_PLATFORM_FEE_BPS"
  ```
  Replace the placeholders with the actual values used during deployment.

## 3. One-Click Application Deployment

The `deploy.sh` script is the recommended method for a safe and complete deployment to Vercel.

### Command

```bash
bash deploy.sh
```

Ensure the script is executable by running `chmod +x deploy.sh` first.

This script automates all steps outlined in the **Deploy Readiness Checklist**.

## 4. Post-Deploy Verification

After the `deploy.sh` script completes, follow these steps to ensure the deployment was successful:

1.  **Visit the Vercel URL:** Open the production URL provided by Vercel at the end of the deployment script.
2.  **Connect Wallet:** Click the "Connect Wallet" button and ensure you can successfully connect with MetaMask or another wallet.
3.  **View Signals:** Confirm that the live signals (events) are loading on the homepage. If they are not, the most likely cause is an incorrect `NEXT_PUBLIC_INTUITION_BETTING_ADDRESS` in your Vercel project's environment variables.
4.  **Admin Login:** As the admin, navigate to the `/admin` page. You should be able to access the Control Matrix. If not, verify that your connected wallet address matches `NEXT_PUBLIC_ADMIN_ADDRESS`.
5.  **Place a Test Stake:** On a live signal, attempt to place a minimum stake. The transaction should prompt for a signature in your wallet and succeed on-chain.

## 5. Rollback Instructions

Vercel makes rollbacks incredibly simple.

1.  **Navigate to your Vercel Project Dashboard.**
2.  **Go to the "Deployments" tab.**
3.  You will see a list of all deployments, including the most recent one (marked as "Current").
4.  Find the **previous** deployment that was stable.
5.  Click the (•••) menu on the right side of that deployment's row.
6.  Select **"Redeploy to Production"**.

Vercel will instantly switch the production domain to point to this older, stable deployment. No files are lost, and you can investigate the issue with the failed deployment without affecting your live users.
