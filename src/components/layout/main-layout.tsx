
'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { BlockchainServiceNotifier } from './blockchain-service-notifier';
import { AppHeader } from './app-header';
import { useWallet } from '@/hooks/use-wallet';
import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

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
            <main className="flex-1 overflow-y-auto relative no-scrollbar lg:pl-24">
                <div className="p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
            </main>
        </div>
    );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { connected, isConnecting } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isMobile = useIsMobile();

  if (!isClient || isConnecting || isMobile === undefined) {
    return null;
  }

  if (!connected) {
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
      );
    }
    return (
      <main className="overflow-y-auto no-scrollbar">
        {children}
      </main>
    );
  }

  return (
    <>
      <BlockchainServiceNotifier />
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </>
  );
}