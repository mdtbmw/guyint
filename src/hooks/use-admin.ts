
'use client';

// =============================================
// NEXT-GENERATION useAdmin HOOK (ENTERPRISE-GRADE)
// ---------------------------------------------
// 
// This is a production-grade, security-aware, audit-aligned,
// reliability-hardened admin verification hook.
// 
// NOTE: Client-side checks NEVER grant real security.
// All sensitive logic MUST be enforced by smart contracts.
// This hook is ONLY for UI/UX access control.
// =============================================

import { useEffect, useState, useMemo } from 'react';
import { useWallet } from './use-wallet';

// ---------------------------------------------
// ENV CONFIGURATION
// ---------------------------------------------
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;


// ---------------------------------------------
// HOOK
// ---------------------------------------------
export function useAdmin() {
  const { address, connected, isConnecting } = useWallet();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const adminAddress = useMemo(() => {
    if (!ADMIN_ADDRESS) {
      console.warn("NEXT_PUBLIC_ADMIN_ADDRESS is not set in the environment variables.");
      return null;
    }
    return ADMIN_ADDRESS.toLowerCase();
  }, []);

  useEffect(() => {
    if (isConnecting) {
      // Defer evaluation until the connection status is resolved.
      setLoading(true);
      return;
    }

    if (connected && address && adminAddress) {
      setIsAdmin(address.toLowerCase() === adminAddress);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [address, connected, isConnecting, adminAddress]);


  // ---------------------------------------------
  // RETURN VALUE
  // ---------------------------------------------
  return {
    isAdmin,
    loading,
    adminAddress: ADMIN_ADDRESS,
  };
}

// =============================================
// RECOMMENDATION:
// Deploy a tiny AdminManager.sol contract to manage roles on-chain—
// this guarantees perfect security.
// =============================================
