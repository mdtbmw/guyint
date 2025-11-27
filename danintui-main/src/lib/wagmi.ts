
import { createConfig, http } from 'wagmi';
import { activeChain, chains } from '@/lib/chains';

// This needs to be exported for use in the hook, but isn't part of the public API
export const wagmiConfig = createConfig({
  chains: chains,
  transports: {
    [activeChain.id]: http(),
  },
  ssr: true,
});
