
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

/**
 * useAdmin hook - Client-side check for administrative privileges.
 * 
 * IMPORTANT: This hook is for UI rendering purposes ONLY (e.g., showing/hiding admin links).
 * It provides a quick client-side check but offers NO actual security.
 * 
 * True security is enforced by backend mechanisms, primarily Firebase Security Rules,
 * which verify the user's UID on every database request. Any user can manipulate
 * client-side code, so never rely on this hook to authorize a sensitive action.
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
      // This is a simple string comparison for UI purposes.
      // The real security check happens in firestore.rules using `request.auth.uid`.
      setIsAdmin(address.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [address, connected]);

  return { isAdmin, loading };
}
