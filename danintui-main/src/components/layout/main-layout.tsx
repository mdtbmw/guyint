
'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { BlockchainServiceNotifier } from './blockchain-service-notifier';
import { AppHeader } from './app-header';
import { useWallet } from '@/hooks/use-wallet';
import React from 'react';
import { cn } from '@/lib/utils';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-inter w-full h-full relative flex">
      <BlockchainServiceNotifier />

      <Sidebar />

      <main className="flex-1 overflow-y-auto relative no-scrollbar pb-28 md:pb-0 md:pl-24 transition-all duration-500">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="font-inter flex-1 overflow-y-auto">
        <AppHeader />
        <main className="overflow-y-auto no-scrollbar">
            {children}
        </main>
      </div>
    );
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
