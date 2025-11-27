'use server';

import type { LeaderboardUser } from "@/lib/types";
import { blockchainService } from "@/services/blockchain";
import { Hex } from "viem";

export async function getLeaderboardStats(): Promise<LeaderboardUser[]> {
    // This is a placeholder for a real user list, which a real dApp
    // would get from an indexer or by scanning past events for unique bettors.
    const MOCK_USER_ADDRESSES: Hex[] = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // hardhat account 0
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // hardhat account 1
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // hardhat account 2
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // hardhat account 3
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // hardhat account 4
    ];

    try {
        const userStatsPromises = MOCK_USER_ADDRESSES.map(async (address) => {
            try {
                const history = await blockchainService.getUserHistory(address);
                const wins = Number(history.wins);
                const losses = Number(history.losses);
                const totalBets = wins + losses;

                if (totalBets === 0) {
                    return null; // Exclude users who have never placed a bet
                }

                const accuracy = (wins / totalBets) * 100;
                const username = await blockchainService.getUsername(address);

                return {
                    id: address,
                    walletAddress: address,
                    username: username,
                    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`,
                    value: accuracy,
                };
            } catch (error) {
                console.error(`Failed to get stats for ${address}:`, error);
                // Gracefully ignore individual user errors to avoid failing the entire leaderboard
                return null;
            }
        });

        const userStats = (await Promise.all(userStatsPromises)).filter(Boolean) as LeaderboardUser[];
        
        // Sort by accuracy in descending order
        return userStats.sort((a, b) => b.value - a.value);

    } catch (error) {
        console.error("Critical: Could not fetch leaderboard stats from the blockchain RPC.", error);
        // Re-throwing the error to allow the client to handle it and show a toast.
        throw new Error("Could not load leaderboard data due to a network issue. Please try again later.");
    }
}
