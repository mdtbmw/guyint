
'use server';

import {
  Hex,
} from 'viem';
import { blockchainService } from '@/services/blockchain';

export async function getUserStats(userAddress: Hex): Promise<{wins: number, losses: number, accuracy: number, winnings: number, trustScore: number}> {

    try {
        const history = await blockchainService.getUserHistory(userAddress);

        const wins = Number(history.wins);
        const losses = Number(history.losses);
        const totalBets = wins + losses;
        const accuracy = totalBets > 0 ? (wins / totalBets) * 100 : 0;
        const trustScore = (wins * 5) - losses;

        // Note: Total winnings requires an indexer to aggregate all WinningsClaimed events.
        // This is not feasible to calculate on the client-side or from contract reads alone.
        const totalWinnings = 0;

        return { wins, losses, accuracy, winnings: totalWinnings, trustScore };

    } catch (error) {
        console.error("Critical: Failed to fetch user stats from the blockchain RPC.", error);
        // Re-throwing the error to allow the client to handle it and show a toast.
        throw new Error("Could not load your on-chain profile data. This may be a network issue.");
    }
}
