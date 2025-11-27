
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

/**
 * useAdmin hook - Client-side check for administrative privileges.
 * 
 * This hook checks if the currently connected wallet address matches the
 * admin address defined in the environment variables. It is intended for
 * UI rendering purposes ONLY (e.g., showing/hiding admin links).
 * 
 * True security is enforced by the smart contract, which has an 'admin'
 * role defined for sensitive functions.
 */
export function useAdmin() {
  const { address, connected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!ADMIN_ADDRESS) {
      console.error("Critical Security Warning: NEXT_PUBLIC_ADMIN_ADDRESS is not configured. Admin features will be disabled.");
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    if (connected && address) {
      const isAddressMatch = address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
      setIsAdmin(isAddressMatch);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [address, connected]);

  return { isAdmin, loading, adminAddress: ADMIN_ADDRESS };
}
