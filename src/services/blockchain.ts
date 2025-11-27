
'use client';

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
  Hex,
  Account,
  Address,
  stringify,
  getContract,
  Hash,
  isAddress,
} from 'viem';
import { intuition } from './chains';
import { contractAbi } from './abi';
import { BetOutcome, type Bet, type Event, type Leaderboard, type LeaderboardUser, EventStatus } from '@/lib/types';
import { getAuth, signInWithCustomToken } from 'firebase/auth';


const CONTRACT_ADDRESS: Address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address;
if (!CONTRACT_ADDRESS) {
    console.warn("NEXT_PUBLIC_CONTRACT_ADDRESS is not set. Some features may not work correctly.");
}


const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: contractAbi,
} as const;

// Helper to wait for window.ethereum
const getEthereumProvider = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  
  if (window.ethereum) {
    return window.ethereum;
  }

  // If not immediately available, poll for it.
  return new Promise(resolve => {
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.ethereum) {
        clearInterval(interval);
        resolve(window.ethereum);
      }
      attempts++;
      if (attempts > 5) { // Try for ~1 second
        clearInterval(interval);
        resolve(null);
      }
    }, 200);
  });
};


class BlockchainService {
  public publicClient: any;
  private walletClient: any;
  private account: Address | undefined;

  constructor() {
    this.publicClient = createPublicClient({
      chain: intuition,
      transport: http(intuition.rpcUrls.default.http[0]),
    });
  }

  private async ensureWalletClient() {
    if (this.walletClient) return;

    const provider = await getEthereumProvider();
    if (provider) {
        this.walletClient = createWalletClient({
            chain: intuition,
            transport: custom(provider),
        });
    } else {
        console.error("MetaMask or a compatible Web3 wallet is not installed.");
        throw new Error("Wallet provider not found. Please install MetaMask.");
    }
  }
  
  async signInWithSignature(address: Address) {
    await this.ensureWalletClient();
    
    const message = `Sign this message to authenticate with Intuition BETs. This does not cost any gas.`;
    const signature = await this.walletClient.signMessage({
        account: address,
        message,
    });
    
    // Send the signature to your backend to get a custom token
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Failed to get custom token from server.');
    }

    const { token } = responseData;

    const auth = getAuth();
    await signInWithCustomToken(auth, token);
}

  async signInAsAdmin(address: Address) {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Admin sign-in failed.');
    }

    const { token } = responseData;
    const auth = getAuth();
    await signInWithCustomToken(auth, token);
  }


  async connectWallet(manualAddress?: string): Promise<Hex | null> {
    const provider = await getEthereumProvider();
     if (!provider) {
      console.log('MetaMask is not installed!');
      return null;
    }
    
    await this.ensureWalletClient();
    
    let address: Address | null = null;
    if (typeof manualAddress === 'string' && isAddress(manualAddress)) {
      address = manualAddress;
    } else {
        const [requestedAddress] = await this.walletClient.requestAddresses();
        address = requestedAddress;
    }
    
    if (!address) {
        throw new Error("Could not retrieve wallet address.");
    }

    this.account = address;

    if (this.account.toLowerCase() !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()) {
        await this.signInWithSignature(this.account);
    }
    
    return address;
  }

  disconnect() {
    this.walletClient = undefined;
    this.account = undefined;
  }

  private async getAccount(): Promise<Address> {
    if (!this.account) {
        const address = await this.connectWallet();
        if (!address) throw new Error("Wallet not connected");
        return address;
    }
    return this.account;
  }

  // ==== READ-ONLY FUNCTIONS ====

  async getUserBet(eventId: bigint, userAddress: Address) {
     if (!CONTRACT_ADDRESS) return null;
     try {
       const bet = await this.publicClient.readContract({
         ...contractConfig,
         functionName: 'getUserBet',
         args: [eventId, userAddress],
       });
       return bet;
     } catch(e) {
       return null;
     }
  }


  // A real implementation might use an off-chain service like ENS or a local profile mapping.
  async getUsername(address: Address): Promise<string> {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  async getUserHistory(userAddress: Hex): Promise<{wins: bigint, losses: bigint}> {
    if (!CONTRACT_ADDRESS) {
      console.error("Contract address is not configured. Cannot fetch user history.");
      return {wins: 0n, losses: 0n};
    }
    try {
        const result = await this.publicClient.readContract({
            ...contractConfig,
            functionName: 'getUserHistory',
            args: [userAddress],
        });
        return { wins: result[0], losses: result[1] };
    } catch (error) {
        console.error(`Failed to fetch user history for ${userAddress} from contract:`, error);
        throw error;
    }
  }

  async getUserTotalWinnings(userAddress: Address): Promise<number> {
    if (!CONTRACT_ADDRESS) return 0;
    console.log(`Fetching total winnings for ${userAddress}...`);
    return Promise.resolve(0);
  }
  
  async getUserBets(userAddress: Hex): Promise<Bet[]> {
       if (!CONTRACT_ADDRESS) return [];
       console.warn("Live getUserBets requires an indexer. Returning empty array.");
       return [];
  }

  async getLeaderboardData(): Promise<Leaderboard> {
     if (!CONTRACT_ADDRESS) return { accuracy: [], earnings: [], activity: [] };
     console.warn("Live getLeaderboardData requires an indexer. Returning empty arrays.");
     return { accuracy: [], earnings: [], activity: [] };
  }


  // ==== WRITE FUNCTIONS ====
  
  async createEvent(description: string, minStake: number, maxStake: number): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      ...contractConfig,
      functionName: 'createEvent',
      args: [description, parseEther(String(minStake)), parseEther(String(maxStake))],
      account,
    });
    return await this.walletClient.writeContract(request);
  }

  async placeBet(eventId: bigint, outcome: boolean, amount: bigint): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      ...contractConfig,
      functionName: 'placeBet',
      args: [eventId, outcome],
      value: amount,
      account,
    });
    return await this.walletClient.writeContract(request);
  }

  async declareResult(eventId: bigint, outcome: boolean): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
        ...contractConfig,
        functionName: 'declareResult',
        args: [eventId, outcome],
        account,
    });
    return await this.walletClient.writeContract(request);
  }

  async cancelEvent(eventId: bigint): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      ...contractConfig,
      functionName: 'cancelEvent',
      args: [eventId],
      account,
    });
    return await this.walletClient.writeContract(request);
}

  async claimWinnings(eventId: bigint): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      ...contractConfig,
      functionName: 'claimWinnings',
      args: [eventId],
      account,
    });
    return await this.walletClient.writeContract(request);
  }

  async claimRefund(eventId: bigint): Promise<Hex> {
    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured.");
    await this.ensureWalletClient();
    const account = await this.getAccount();
    const { request } = await this.publicClient.simulateContract({
      ...contractConfig,
      functionName: 'claimRefund',
      args: [eventId],
      account,
    });
    return await this.walletClient.writeContract(request);
  }

  async faucet(address: Address): Promise<Hash> {
     await this.ensureWalletClient();
     const account = await this.getAccount();
      const request = await this.publicClient.prepareTransactionRequest({
        account,
        to: address,
        value: parseEther('0'),
      });
      return await this.walletClient.sendTransaction(request);
  }

  async waitForTransaction(hash: Hash) {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }
}

export const blockchainService = new BlockchainService();
