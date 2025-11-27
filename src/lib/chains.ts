import { intuitionChain as intuitionChainDefinition } from './intuition-chain';

// This is the single source of truth for the chain configuration.
// CRITICAL: We explicitly disable multicall here because the custom Intuition
// chain does not support the multicall3 contract. This prevents runtime errors.
export const activeChain = {
    ...intuitionChainDefinition,
    contracts: {
        ...intuitionChainDefinition.contracts,
        multicall3: undefined,
    },
};


// An array of all supported chains.
// This is used by the Web3Provider to configure Wagmi.
export const chains = [activeChain] as const;
