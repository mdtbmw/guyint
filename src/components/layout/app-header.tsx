'use client';

import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SidebarSheet } from './sidebar-sheet';
import { Logo } from '../icons';

export function AppHeader() {
  const router = useRouter();
  
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/10 bg-background-dark/80 px-4 backdrop-blur-sm sm:px-6 md:hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-white text-2xl font-bold tracking-tighter">Intuition</h1>
        </div>
        <div className="flex items-center gap-2">
            <w3m-button />
            <SidebarSheet />
        </div>
    </header>
  );
}
