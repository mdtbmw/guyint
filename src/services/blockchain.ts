'use client';

import {
  createPublicClient,
  http,
  formatEther,
  parseEther,
  Hex,
  Account,
  Address,
  Hash,
  HttpRequestError,
  ContractFunctionExecutionError,
} from 'viem';
import { createAtomFromString } from '@0xintuition/sdk';
import type { Event, EventStatus } from '@/lib/types';
import { WalletClient } from 'wagmi';
import { intuitionMainnet } from '@/lib/intuition-mainnet';

const INTUITION_VAULT_ADDRESS: Address | undefined = process.env.NEXT_PUBLIC_INTUITION_VAULT_ADDRESS as Address;

if (!INTUITION_VAULT_ADDRESS) {
  throw new Error("CRITICAL: NEXT_PUBLIC_INTUITION_VAULT_ADDRESS environment variable is not set. This is required for the Intuition SDK.");
}

class IntuitionService {
  public publicClient;
  
  constructor() {
    this.publicClient = createPublicClient({
      chain: intuitionMainnet,
      transport: http(),
    });
  }

  // --- MOCKED DATA ---
  // The @0xintuition/sdk documentation doesn't specify how to query atoms.
  // In a real app, you'd use the SDK or a GraphQL endpoint to fetch this data.
  // For now, we mock the data to keep the UI functional.
  private mockEvents: Event[] = [
    {
      id: "1",
      question: "Will the Intuition Protocol surpass 10,000 active users by the end of the year?",
      category: "Crypto",
      status: "open",
      outcomes: { yes: 5500, no: 4500 },
      totalPool: 10000,
      participants: [],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      minStake: 10,
      maxStake: 1000,
    },
    {
        id: "2",
        question: "Will the next major version of the Intuition SDK be released in Q3?",
        category: "World Events",
        status: "open",
        outcomes: { yes: 8200, no: 1800 },
        totalPool: 10000,
        participants: [],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        minStake: 5,
        maxStake: 500,
    }
  ];
  // --- END MOCKED DATA ---


  // This function is now a placeholder. A real implementation would query the Intuition network.
  async getAllEvents(): Promise<Event[]> {
    console.log("INTUITION_SDK: Returning mocked event data. In production, this should query the Intuition GraphQL API or SDK.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return this.mockEvents;
  }
  
  // This function is now a placeholder.
  async getEventById(eventId: string): Promise<Event | null> {
    console.log(`INTUITION_SDK: Returning mocked event data for ID: ${eventId}.`);
    const event = this.mockEvents.find(e => e.id === eventId) || null;
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return event;
  }

  // This function is now a placeholder.
  async getMultipleUserBets(eventIds: bigint[], userAddress: Address): Promise<any[]> {
    console.log("INTUITION_SDK: Returning empty user bets array. This needs to be implemented with the SDK.");
    return [];
  }

  // This function is now a placeholder.
  async getUserHistory(userAddress: Hex): Promise<{wins: bigint, losses: bigint}> {
    console.log("INTUITION_SDK: Returning mocked user history. This needs to be implemented with the SDK.");
    return { wins: 5n, losses: 2n };
  }

  // This function IS IMPLEMENTED using the official SDK.
  async createEvent(walletClient: WalletClient, account: Account, description: string, endDate: Date, category: string, minStake: number, maxStake: number): Promise<Hex> {
    const config = {
      walletClient: walletClient as any,
      publicClient: this.publicClient,
      ethMultiVaultAddress: INTUITION_VAULT_ADDRESS,
    };

    console.log("INTUITION_SDK: Calling createAtomFromString with description:", description);
    
    // The SDK's createAtomFromString function creates a new "atom" which represents our event question.
    const result = await createAtomFromString(config, description);

    if (!result.hash) {
      throw new Error("Intuition SDK: Failed to create atom, transaction hash is missing.");
    }
    
    // In a real scenario, you might create additional "triples" to store metadata 
    // like category, endDate, min/max stake, linking them to the atom you just created.
    console.log(`INTUITION_SDK: Atom created successfully. Transaction hash: ${result.hash}. Atom ID: ${result.atomId}`);

    // Add to mock data for instant UI update
    this.mockEvents.push({
      id: result.atomId.toString(),
      question: description,
      category,
      endDate,
      minStake,
      maxStake,
      status: "open",
      outcomes: { yes: 0, no: 0 },
      totalPool: 0,
      participants: [],
    });

    return result.hash;
  }

  // --- The following functions are now placeholders and need to be implemented with the SDK ---
  // The SDK docs provided don't cover these actions, so we'll simulate them.
  
  async placeBet(walletClient: WalletClient, account: Account, eventId: bigint, outcome: boolean, amount: bigint): Promise<Hex> {
    console.log(`INTUITION_SDK: Simulating placeBet for event ${eventId}. This needs a real SDK implementation.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you would create a triple: (user, 'betsOn', eventId), with the amount and outcome as metadata.
    return `0x${Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}` as Hex;
  }

  async declareResult(walletClient: WalletClient, account: Account, eventId: bigint, outcome: boolean): Promise<Hex> {
    console.log(`INTUITION_SDK: Simulating declareResult for event ${eventId}. This needs a real SDK implementation.`);
    return `0x${Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}` as Hex;
  }

  async cancelEvent(walletClient: WalletClient, account: Account, eventId: bigint): Promise<Hex> {
     console.log(`INTUITION_SDK: Simulating cancelEvent for event ${eventId}. This needs a real SDK implementation.`);
     return `0x${Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}` as Hex;
  }

  async claimWinnings(walletClient: WalletClient, account: Account, eventId: bigint): Promise<Hex> {
    console.log(`INTUITION_SDK: Simulating claimWinnings for event ${eventId}. This needs a real SDK implementation.`);
    return `0x${Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}` as Hex;
  }
  
  async claimRefund(walletClient: WalletClient, account: Account, eventId: bigint): Promise<Hex> {
      console.log(`INTUITION_SDK: Simulating claimRefund for event ${eventId}. This needs a real SDK implementation.`);
      return `0x${Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('')}` as Hex;
  }
  
  async getAllBettors(): Promise<Address[]> {
    console.log("INTUITION_SDK: Returning empty bettors array. This needs a real SDK implementation.");
    return [];
  }

  async waitForTransaction(hash: Hash) {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }
}

export const blockchainService = new IntuitionService();
