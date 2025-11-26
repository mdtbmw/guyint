
'use client';

import { createPublicClient, http, formatEther, parseEther, Hex, Address, Hash, WalletClient, PublicClient, getAddress, UserRejectedRequestError, TransactionReceipt, decodeEventLog } from 'viem';
import type { Event, BetOutcome, EventStatus, NotificationType } from '@/lib/types';
import { IntuitionBettingAbi } from '@/lib/IntuitionBettingAbi';
import { activeChain } from '@/lib/chains';
import placeholderData from '@/lib/placeholder-images.json';

// This is a global function to be initialized by a top-level component
let notify: (notification: Omit<NotificationType, 'id' | 'timestamp' | 'read'>) => void;
export const initializeBlockchainServiceNotifier = (addNotification: (notification: Omit<NotificationType, 'id' | 'timestamp' | 'read'>) => void) => {
    notify = addNotification;
}

const bettingAddressRaw = process.env.NEXT_PUBLIC_INTUITION_BETTING_ADDRESS;
const DESCRIPTION_IMAGE_DELIMITER = '|||';

// Simple in-memory cache
let eventsCache: Event[] | null = null;
let lastCacheTime: number | null = null;
const CACHE_DURATION_MS = 30000; // 30 seconds

class IntuitionService {
  public publicClient: PublicClient;
  private contractAddress: Address | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: activeChain,
      transport: http(),
      batch: { multicall: false } 
    });

    if (bettingAddressRaw) {
        try {
            this.contractAddress = getAddress(bettingAddressRaw);
        } catch {
             console.error(`FATAL_ERROR: The provided NEXT_PUBLIC_INTUITION_BETTING_ADDRESS "${bettingAddressRaw}" is not a valid Ethereum address.`);
        }
    }
  }

  private getContractAddress(): Address | null {
    if (!this.contractAddress) {
        if (process.env.NODE_ENV === 'development') {
            console.warn("Configuration Warning: The smart contract address (NEXT_PUBLIC_INTUITION_BETTING_ADDRESS) is not set or is invalid. The application will run in a limited mode. Please check your .env file.");
        }
        return null;
    }
    return this.contractAddress;
  }


  public clearCache() {
    eventsCache = null;
    lastCacheTime = null;
    console.log("Blockchain service cache cleared.");
  }
  
  private parseDescriptionAndImage(fullDescription: string): { description: string, imageUrl?: string } {
    if (fullDescription.includes(DESCRIPTION_IMAGE_DELIMITER)) {
      const parts = fullDescription.split(DESCRIPTION_IMAGE_DELIMITER);
      return {
        description: parts[0],
        imageUrl: parts[1]
      };
    }
    return { description: fullDescription };
  }


  private normalizeOnChainEvent(eventData: any, id: bigint): Event {
    const totalPool = Number(formatEther(eventData.yesPool)) + Number(formatEther(eventData.noPool));
    
    let status: EventStatus;
    switch(eventData.status) {
        case 0: status = 'open'; break;
        case 1: status = 'closed'; break;
        case 2: status = 'finished'; break;
        case 3: status = 'canceled'; break;
        default: status = 'open';
    }
    
    const bettingStopDate = eventData.bettingStopDate > 0 ? new Date(Number(eventData.bettingStopDate) * 1000) : null;
    const resolutionDate = eventData.resolutionDate > 0 ? new Date(Number(eventData.resolutionDate) * 1000) : null;
    
    // If betting has ended but not resolved, status should be 'closed'
    if (status === 'open' && bettingStopDate && bettingStopDate < new Date()) {
      status = 'closed';
    }


    let winningOutcome: BetOutcome | undefined = undefined;
    if(eventData.winningOutcome === 1) winningOutcome = 'YES';
    else if (eventData.winningOutcome === 2) winningOutcome = 'NO';
    
    const { description, imageUrl: parsedImageUrl } = this.parseDescriptionAndImage(eventData.description || '');
    
    return {
      id: String(id),
      question: eventData.question,
      description,
      imageUrl: eventData.imageUrl || parsedImageUrl,
      category: eventData.category,
      startDate: null, // The contract doesn't store a start date
      bettingStopDate: bettingStopDate,
      resolutionDate: resolutionDate,
      minStake: Number(formatEther(eventData.minStake)),
      maxStake: Number(formatEther(eventData.maxStake)),
      status: status,
      outcomes: {
        yes: Number(formatEther(eventData.yesPool)),
        no: Number(formatEther(eventData.noPool)),
      },
      totalPool: totalPool,
      participants: [], // This would require a separate indexing service to track efficiently
      winningOutcome: winningOutcome,
    };
  }

  private handleContractError(err: any, context: string): never {
      console.error(`Error in ${context}:`, err);
      // Attempt to find a more specific reason
      const reason = (err.cause as any)?.reason || err.shortMessage || 'An unknown contract error occurred.';
      
      throw new Error(`A contract error occurred: ${reason}. Please check the console for details.`);
  }

  async getPlatformFee(): Promise<number> {
    const address = this.getContractAddress();
    if (!address) return 0;

    try {
        const feeBps = await this.publicClient.readContract({
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'platformFeeBps',
        });
        return Number(feeBps);
    } catch (e) {
        console.error("Failed to fetch platform fee", e);
        return 300; // Default to 3% if fetch fails
    }
  }

  async getAllEvents(): Promise<Event[]> {
     const now = Date.now();
     if (eventsCache && lastCacheTime && (now - lastCacheTime < CACHE_DURATION_MS)) {
        console.log("Returning cached events");
        return eventsCache;
     }

    try {
        const address = this.getContractAddress();
        if (!address) return [];

        const nextId = await this.publicClient.readContract({
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'nextEventId',
        });
        
        if (!nextId || nextId === 0n) {
            eventsCache = [];
            lastCacheTime = now;
            return [];
        }

        const eventIds = Array.from({ length: Number(nextId) }, (_, i) => BigInt(i));
        
        if (eventIds.length === 0) {
          eventsCache = [];
          lastCacheTime = now;
          return [];
        }

        const eventPromises = eventIds.map(id => 
          this.publicClient.readContract({
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'getEvent',
            args: [id],
          }).catch(err => {
            console.error(`Failed to fetch event ${id}:`, err);
            return null; // Return null on failure for this specific call
          })
        );
      
      const onchainResults = await Promise.all(eventPromises);

      const events = onchainResults
        .map((res, index) => {
          if (res) {
            return this.normalizeOnChainEvent(res, eventIds[index]);
          }
          return null;
        })
        .filter((e): e is Event => e !== null && e.id !== "0" && e.question !== '');

      const sortedEvents = events.sort((a, b) => (b.bettingStopDate?.getTime() || 0) - (a.bettingStopDate?.getTime() || 0));
      
      eventsCache = sortedEvents;
      lastCacheTime = now;

      return sortedEvents;

    } catch (err: any) {
       console.error('Core `getAllEvents` call failed. This could be due to an RPC issue or invalid contract address.', err.message);
       throw new Error("Failed to fetch event data from the blockchain. The network may be congested or the service unavailable.");
    }
  }

  async getEventById(eventId: string): Promise<Event | null> {
    const address = this.getContractAddress();
    if (!address) return null; // Return empty if no address is set

    if (eventsCache) {
      const cachedEvent = eventsCache.find(e => e.id === eventId);
      if (cachedEvent) return cachedEvent;
    }

    try {
      const eventData = await this.publicClient.readContract({
        address: address,
        abi: IntuitionBettingAbi,
        functionName: 'getEvent',
        args: [BigInt(eventId)],
      });
      
      const participants: Address[] = []; 

      const normalized = this.normalizeOnChainEvent(eventData, BigInt(eventId));
      normalized.participants = participants;
      return normalized;

    } catch (err) {
      return null;
    }
  }
  
  async getMultipleUserBets(eventIds: bigint[], userAddress: Address): Promise<{yesAmount: bigint, noAmount: bigint, claimed: boolean, hasBet: boolean}[]> {
    const address = this.getContractAddress();
    if (!address) return [];

    try {
        const betPromises = eventIds.map(id => 
            this.publicClient.readContract({
                address: address,
                abi: IntuitionBettingAbi,
                functionName: 'getUserBet',
                args: [id, userAddress],
            }).then(bet => ({ ...bet, hasBet: bet.yesAmount > 0n || bet.noAmount > 0n }))
            .catch(err => {
                console.error(`Failed to fetch user bet for event ${id}:`, err);
                return { yesAmount: 0n, noAmount: 0n, claimed: false, hasBet: false }; // Return default on failure
            })
        );
        const results = await Promise.all(betPromises);
        return results;
    } catch(e) {
        console.error("Batch fetch for user bets failed", e);
        // Return an array of default values matching the input length
        return eventIds.map(() => ({ yesAmount: 0n, noAmount: 0n, claimed: false, hasBet: false }));
    }
  }

  async getAllLogs(userAddress?: Address) {
    const address = this.getContractAddress();
    if (!address) return { betPlaced: [], winningsClaimed: [], eventCanceled: [] };

    const fromBlock = 0n;

    try {
      const betPlacedEvent = IntuitionBettingAbi.find((item) => item.type === 'event' && item.name === 'BetPlaced');
      const winningsClaimedEvent = IntuitionBettingAbi.find((item) => item.type === 'event' && item.name === 'WinningsClaimed');
      const eventCanceledEvent = IntuitionBettingAbi.find((item) => item.type === 'event' && item.name === 'EventCanceled');

      if (!betPlacedEvent || !winningsClaimedEvent || !eventCanceledEvent) {
          throw new Error("Could not find required ABI event definitions.");
      }

      const [betPlacedLogs, winningsClaimedLogs, eventCanceledLogs] = await Promise.all([
        this.publicClient.getLogs({
          address: address,
          event: betPlacedEvent,
          args: userAddress ? { user: userAddress } : undefined,
          fromBlock,
          toBlock: 'latest',
        }),
        this.publicClient.getLogs({
          address: address,
          event: winningsClaimedEvent,
          args: userAddress ? { user: userAddress } : undefined,
          fromBlock,
          toBlock: 'latest',
        }),
        this.publicClient.getLogs({
          address: address,
          event: eventCanceledEvent,
          fromBlock,
          toBlock: 'latest',
        }),
      ]);

      const decodeLogs = (logs: any[], eventAbi: any) => {
        return logs.map(log => {
          const decoded = decodeEventLog({ abi: [eventAbi], ...log });
          return { ...(decoded.args as object), blockNumber: log.blockNumber };
        })
      }

      return {
        betPlaced: decodeLogs(betPlacedLogs, betPlacedEvent),
        winningsClaimed: decodeLogs(winningsClaimedLogs, winningsClaimedEvent),
        eventCanceled: decodeLogs(eventCanceledLogs, eventCanceledEvent),
      };
    } catch (e) {
      console.error("Failed to fetch logs:", e);
      return { betPlaced: [], winningsClaimed: [], eventCanceled: [] };
    }
  }
  
  async createEvent(
    walletClient: WalletClient, 
    account: Address, 
    question: string,
    description: string,
    category: string,
    bettingStopDate: Date,
    resolutionDate: Date,
    minStake: number, 
    maxStake: number,
    imageUrl?: string
): Promise<{txHash: Hash, eventId: string}> {
    const address = this.getContractAddress();
    if (!address) throw new Error('Contract address not configured');
    if (!walletClient.account) throw new Error('Wallet client is not connected.');
    
    notify({
        title: 'Transaction Submitted',
        description: `Creating event... please wait for confirmation.`,
        icon: 'Loader2',
        type: 'onBetPlaced' // This should be a generic type
    });

    try {
        const fullDescription = description;
        
        const finalImageUrl = imageUrl || placeholderData.categories.find(c => c.name === category)?.image || '';

        const bettingTimestamp = BigInt(Math.floor(bettingStopDate.getTime() / 1000));
        const resolutionTimestamp = BigInt(Math.floor(resolutionDate.getTime() / 1000));

        const minStakeWei = parseEther(String(minStake));
        const maxStakeWei = parseEther(String(maxStake));

        const { request } = await this.publicClient.simulateContract({
            account,
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'createEvent',
            args: [question, fullDescription, category, finalImageUrl, bettingTimestamp, resolutionTimestamp, minStakeWei, maxStakeWei],
        });
        const txHash = await walletClient.writeContract(request);
        const receipt = await this.waitForTransaction(txHash);

        const eventLog = receipt.logs.find(log => {
          try {
            const decoded = decodeEventLog({ abi: IntuitionBettingAbi, ...log });
            return decoded.eventName === 'EventCreated';
          } catch {
            return false;
          }
        });

        if (!eventLog) throw new Error('Could not find EventCreated log in transaction receipt');

        const decodedLog = decodeEventLog({ abi: IntuitionBettingAbi, ...eventLog });
        const eventId = (decodedLog.args as any)?.id?.toString();

        if (!eventId) throw new Error('Could not determine eventId from transaction receipt');
      
        this.clearCache();

        notify({
            title: 'Event Created Successfully!',
            description: `The event is now live. Click to view.`,
            icon: 'CheckCircle',
            variant: 'success',
            href: `/event/${eventId}`,
            type: 'onBetPlaced' // This should be generic
        });

        return { txHash, eventId };

    } catch (err) {
        this.handleContractError(err, 'create event');
    }
  }

  async placeBet(walletClient: WalletClient, account: Address, eventId: bigint, outcome: boolean, amountString: string): Promise<Hash> {
    const address = this.getContractAddress();
    if (!address) throw new Error('Contract address not configured');
    if (!walletClient.account) throw new Error('Wallet client is not connected.');
    
    try {
        const amount = parseEther(amountString);
        
        const { request } = await this.publicClient.simulateContract({
        account: walletClient.account,
        address: address,
        abi: IntuitionBettingAbi,
        functionName: 'placeBet',
        args: [eventId, outcome],
        value: amount
        });
        return walletClient.writeContract(request);
    } catch (err) {
        this.handleContractError(err, 'place bet');
    }
  }

  async resolveEvent(walletClient: WalletClient, account: Address, eventId: bigint, outcome: boolean): Promise<Hash> {
     const address = this.getContractAddress();
     if (!address) throw new Error('Contract address not configured');
     if (!walletClient.account) throw new Error('Wallet client is not connected.');
     
     try {
        const { request } = await this.publicClient.simulateContract({
            account: walletClient.account,
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'resolveEvent',
            args: [eventId, outcome],
        });
        return walletClient.writeContract(request);
    } catch (err) {
        this.handleContractError(err, 'declare result');
    }
  }

  async cancelEvent(walletClient: WalletClient, account: Address, eventId: bigint): Promise<Hash> {
    const address = this.getContractAddress();
    if (!address) throw new Error('Contract address not configured');
    if (!walletClient.account) throw new Error('Wallet client is not connected.');
    try {
        const { request } = await this.publicClient.simulateContract({
            account: walletClient.account,
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'cancelEvent',
            args: [eventId],
        });
        return walletClient.writeContract(request);
    } catch (err) {
        this.handleContractError(err, 'cancel event');
    }
  }

  async claim(walletClient: WalletClient, account: Address, eventId: bigint): Promise<Hash> {
    const address = this.getContractAddress();
    if (!address) throw new Error('Contract address not configured');
    if (!walletClient.account) throw new Error('Wallet client is not connected or account is not available.');

    try {
        const { request } = await this.publicClient.simulateContract({
            account: walletClient.account,
            address: address,
            abi: IntuitionBettingAbi,
            functionName: 'claim',
            args: [eventId],
        });
        return walletClient.writeContract(request);
    } catch (err) {
        this.handleContractError(err, 'claim winnings');
    }
  }

  async waitForTransaction(hash: Hash): Promise<TransactionReceipt> {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }
}

export const blockchainService = new IntuitionService();
