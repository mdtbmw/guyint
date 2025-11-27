'use client';

import { useEffect } from 'react';
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

  const isLoading = isConnecting || adminLoading;

  useEffect(() => {
    // If we're still figuring out connection status or admin status, do nothing yet.
    if (isLoading) {
      return;
    }

    // If a connection is required and the user is not connected, redirect to home.
    if (!connected) {
      router.replace('/');
      return;
    }

    // If admin is required and the user is definitively NOT an admin, redirect.
    if (requireAdmin && !isAdmin) {
      router.replace('/');
      return;
    }
    
  }, [isLoading, connected, isAdmin, requireAdmin, router]);

  // Return true if wallet is connecting OR if we require admin and admin status is loading.
  return { isLoading };
}
