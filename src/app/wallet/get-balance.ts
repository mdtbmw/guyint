
'use server';

import { createPublicClient, http, formatEther, Address } from 'viem';
import { intuition } from '@/services/chains';

export async function getWalletBalance(address: Address): Promise<number> {
    const publicClient = createPublicClient({
        chain: intuition,
        transport: http(intuition.rpcUrls.default.http[0]),
    });

    try {
      const balance = await publicClient.getBalance({ address });
      return Number(formatEther(balance));
    } catch (e) {
      console.error("Server-side getBalance failed:", e);
      // Return 0 on failure to prevent app crash and allow UI to show an error state.
      return 0;
    }
}
