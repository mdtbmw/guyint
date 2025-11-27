'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { BlockchainServiceNotifier } from './blockchain-service-notifier';
import { AppHeader } from './app-header';
import { useWallet } from '@/hooks/use-wallet';
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { NetworkSwitcher } from '../network-switcher';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useIsMobile();

    if (isMobile === undefined) {
        return null; // or a skeleton loader
    }
    
    if (isMobile) {
        return (
            <div className="font-inter w-full h-dvh relative flex flex-col">
                 <AppHeader />
                 <main className="flex-1 overflow-y-auto relative no-scrollbar">
                    <div className="p-4 sm:p-6 pb-28">
                        {children}
                    </div>
                </main>
                <BottomNav />
            </div>
        )
    }

    return (
        <div className="font-inter w-full h-full relative flex flex-row">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative no-scrollbar lg:pl-24 sidebar-transition">
                <div className="p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
            </main>
        </div>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { connected, isConnecting } = useWallet();
  const isMounted = useIsMounted();

  // Show a loading state or null during initial render and connection checks
  if (!isMounted) {
    // This prevents a flash of the landing page before the connection status is known
    return null;
  }

  if (isConnecting) {
    // While connecting, we show nothing to prevent layout shifts.
    // The body background is already set, so this won't be a "black" screen.
    return null;
  }

  // Anonymous user flow: ALWAYS show only the children (which will be the landing page)
  if (!connected) {
      return (
          <main className="overflow-y-auto h-dvh no-scrollbar">
              {children}
          </main>
      );
  }

  // Authenticated user flow
  return (
    <>
      <BlockchainServiceNotifier />
      <NetworkSwitcher />
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </>
  );
}
