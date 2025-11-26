# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Setup

To run this application, you need to set up the following environment variables in a `.env` file in the root of your project.

```
# Core Blockchain Connection (Required for App and Deployment)
NEXT_PUBLIC_INTUITION_RPC=YOUR_INTUITION_NETWORK_RPC_URL
NEXT_PUBLIC_INTUITION_CHAIN_ID=YOUR_INTUITION_NETWORK_CHAIN_ID

# WalletConnect (Required for Wallet Button)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID

# Smart Contract Deployment & Admin (Required for Deployment and Admin Actions)
INTUITION_DEPLOYER_PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY
NEXT_PUBLIC_ADMIN_ADDRESS=YOUR_ADMIN_WALLET_ADDRESS
TREASURY_ADDRESS=YOUR_TREASURY_WALLET_ADDRESS
PLATFORM_FEE_BPS=300

# Deployed Contract Address (Required after first deployment)
NEXT_PUBLIC_INTUITION_BETTING_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

### How to Get Each Value

#### 1. `NEXT_PUBLIC_INTUITION_RPC` & `NEXT_PUBLIC_INTUITION_CHAIN_ID`

*   **What it is:** These variables tell your application how to connect to the specific blockchain network where your smart contract lives.
*   **For the Intuition Testnet:**
    *   `NEXT_PUBLIC_INTUITION_RPC`: `https://rpc.intuition.systems/http`
    *   `NEXT_PUBLIC_INTUITION_CHAIN_ID`: `1155`

#### 2. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

*   **What it is:** This is a free ID from WalletConnect that allows your app to show a "Connect Wallet" button and link up with hundreds of wallet apps.
*   **How to get it:**
    1.  Go to [cloud.walletconnect.com](https://cloud.walletconnect.com) and sign in.
    2.  Click **"Create Project"** and give your project a name (e.g., "Intuition BETs").
    3.  Your **Project ID** will be displayed on your project's dashboard. Copy it.
    4.  Paste it into your `.env` file.

#### 3. `INTUITION_DEPLOYER_PRIVATE_KEY` & `NEXT_PUBLIC_ADMIN_ADDRESS`

*   **`INTUITION_DEPLOYER_PRIVATE_KEY`:** This is the **top-secret key** for the wallet you want to use to deploy the smart contract. This account will be the initial owner/administrator of the contract.
*   **`NEXT_PUBLIC_ADMIN_ADDRESS`:** This is the public wallet address corresponding to the private key above.
*   **How to get them (from MetaMask):**
    1.  In MetaMask, select the account you want to use for deployment.
    2.  Your public address is shown at the top. Copy it and paste it as the value for `NEXT_PUBLIC_ADMIN_ADDRESS`.
    3.  Click the three dots (⋮) and select **"Account details"**.
    4.  Click **"Show private key"** and follow the prompts.
    5.  Copy the private key and paste it as the value for `INTUITION_DEPLOYER_PRIVATE_KEY`.

    > **CRITICAL SECURITY WARNING:** Never, ever share this private key with anyone or commit it to a public repository. It provides full control over your wallet's funds and contract ownership.

#### 4. `TREASURY_ADDRESS` & `PLATFORM_FEE_BPS`

*   **`TREASURY_ADDRESS`:** The public wallet address where the 3% platform fees will be collected. This can be the same as your admin address or a different secure wallet.
*   **`PLATFORM_FEE_BPS`:** The platform fee in "basis points". `300` equals a 3% fee.

#### 5. `NEXT_PUBLIC_INTUITION_BETTING_ADDRESS`

*   **What it is:** This is the final address of your smart contract after you have successfully deployed it to the blockchain.
*   **How to get it:**
    1.  First, complete all the steps above and fill in the first set of variables in your `.env` file.
    2.  Run the deployment command from your terminal: `npm run deploy:intuition`
    3.  The script will use your deployer key to send the contract to the blockchain. When it's finished, it will print the new contract address to your console.
    4.  Copy the address from the console.
    5.  Paste it into your `.env` file as the final step.

Once all variables are set, your application will be fully configured and ready to run.
