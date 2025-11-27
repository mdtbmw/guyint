
#!/bin/bash

# =================================================================
# Intuition BETs - One-Click Deployment Script for Vercel
# =================================================================
# This script automates the entire deployment process, from
# dependency installation to live deployment on Vercel.
#
# It is designed to be idempotent and fail fast.
# =================================================================

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Helper Functions ---
print_step() {
  echo ""
  echo "🚀 Step: $1"
  echo "------------------------------------------------"
}

print_success() {
  echo "✅  $1"
}

print_error() {
  echo "❌ Error: $1"
  exit 1
}


# --- Main Deployment Logic ---

# 1. Install Dependencies
print_step "Installing project dependencies..."
npm install || print_error "Failed to install npm dependencies."
print_success "Dependencies installed."

# 2. Code Quality Checks
print_step "Running code quality checks..."
npm run lint || print_error "Linting failed. Please fix lint errors."
npm run typecheck || print_error "Type checking failed. Please fix TypeScript errors."
print_success "Code quality checks passed."

# 3. Deploy Smart Contract
# This command will deploy the contract to the network specified
# by your .env and hardhat.config.ts files.
print_step "Deploying smart contract..."
npm run deploy:intuition || print_error "Smart contract deployment failed. Check Hardhat logs."
print_success "Smart contract deployed. Please ensure the new contract address is in your .env file before proceeding to the final Vercel deploy."

# 4. Prompt user to update .env before final deploy
echo ""
echo "🛑 IMPORTANT: The contract address has been printed above."
echo "You MUST now copy this new address into your NEXT_PUBLIC_INTUITION_BETTING_ADDRESS variable in your .env file."
echo "This value must also be set in your Vercel project's environment variables for the deployed app to work."
read -p "Have you updated the .env file and Vercel environment variables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Deployment aborted by user. Please update the contract address and run the final deploy command manually."
    echo "You can deploy to Vercel with: npx vercel --prod"
    exit 1
fi


# 5. Build the Application for Production
print_step "Building the Next.js application for production..."
npm run build || print_error "Next.js build failed."
print_success "Application built successfully."

# 6. Deploy to Vercel
print_step "Deploying to Vercel for production..."
# This command assumes you have the Vercel CLI installed and are logged in.
# It will deploy the contents of the .next directory to production.
npx vercel --prod || print_error "Vercel deployment failed."

# Final Success Message
echo ""
echo "===================================================================="
echo "   🎉  Deployment to Vercel Complete!  🎉"
echo "===================================================================="
echo "Your application is now live."
echo ""
