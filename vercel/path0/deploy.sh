
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
print_step "Deploying smart contract..."
# Run the deployment script and capture the output.
# The `deploy.js` script is designed to print ONLY the contract address on its last line.
DEPLOY_OUTPUT=$(npm run deploy:intuition)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | tail -n 1)

# Validate that we got a reasonable-looking address
if [[ ! "$CONTRACT_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
  echo "Full deployment output:"
  echo "$DEPLOY_OUTPUT"
  print_error "Failed to extract a valid contract address from deployment script. Aborting."
fi

# Temporarily store the address
echo "$CONTRACT_ADDRESS" > .contract-address

print_success "Smart contract deployed successfully."
echo "   New Contract Address: $CONTRACT_ADDRESS"

# 4. Update local .env file
print_step "Updating local .env file..."
if [ -f .env ]; then
    # Use awk to preserve comments and formatting
    awk -v addr="$CONTRACT_ADDRESS" 'BEGIN{FS=OFS="="} $1=="NEXT_PUBLIC_INTUITION_BETTING_ADDRESS" {$2=addr} 1' .env > .env.tmp && mv .env.tmp .env
    print_success ".env file updated with new contract address."
else
    echo "NEXT_PUBLIC_INTUITION_BETTING_ADDRESS=$CONTRACT_ADDRESS" >> .env
    print_success "Created .env file with new contract address."
fi

# 5. Build the Application for Production
print_step "Building the Next.js application for production..."
npm run build || print_error "Next.js build failed."
print_success "Application built successfully."


# 6. Final Vercel Deployment with updated environment variable
print_step "Deploying to Vercel for production..."
echo "Using contract address: $CONTRACT_ADDRESS"
# This command assumes you have the Vercel CLI installed and are logged in.
# It will deploy the contents of the .next directory to production.
# The `--env` flag sets the environment variable for THIS deployment only.
# You MUST also set this in the Vercel dashboard for future deployments.
npx vercel --prod --env NEXT_PUBLIC_INTUITION_BETTING_ADDRESS=$CONTRACT_ADDRESS || print_error "Vercel deployment failed."

# Clean up the temp file
rm -f .contract-address

# Final Success Message & Action Required
echo ""
echo "===================================================================="
echo "   🎉  Deployment to Vercel Complete!  🎉"
echo "===================================================================="
echo "Your application is now live."
echo ""
echo "🛑 FINAL ACTION REQUIRED:"
echo "You must now update your Vercel project's Environment Variables."
echo "Set the following variable in your Vercel dashboard:"
echo ""
echo "   NEXT_PUBLIC_INTUITION_BETTING_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo "This ensures future automatic deployments from Git will work correctly."
echo "===================================================================="
echo ""

