
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from './use-wallet';
import { useAdmin } from './use-admin';

interface AuthGuardOptions {
  requireAdmin?: boolean;
}

/**
 * A hook to protect pages that require authentication or admin privileges.
 * It handles loading states and redirects users appropriately.
 *
 * @param {AuthGuardOptions} options - Configuration for the guard.
 * @param {boolean} [options.requireAdmin=false] - If true, the user must be an admin to access the page.
 * @returns {{ isLoading: boolean }}
 *          - `isLoading`: True while the authentication status is being determined.
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireAdmin = false } = options;
  const router = useRouter();
  const { connected, isConnecting } = useWallet();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // The overall loading state depends on wallet connection and, if required, admin verification.
  const isLoading = isConnecting || (requireAdmin && adminLoading);
  
  // A separate state to track if the initial verification round is complete.
  // This prevents redirects on the very first render before hooks have settled.
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Once loading is finished, we can stop verifying.
    if (!isLoading) {
      setIsVerifying(false);
    }
    
    // Don't perform redirects until the initial verification is complete.
    if (isVerifying) {
      return;
    }

    // If not connected, always redirect to home.
    if (!connected) {
      router.push('/');
      return;
    }

    // If admin is required and the connected user is not an admin, redirect.
    if (requireAdmin && !isAdmin) {
      router.push('/');
      return;
    }
    
  }, [isLoading, isVerifying, connected, isAdmin, requireAdmin, router]);

  // The page should show a loading state as long as hooks are resolving.
  return { isLoading };
}
