'use client';

import { useWallet } from '@/hooks/use-wallet';
import { WelcomeScreen } from '@/components/welcome-screen';
import { AppHeader } from './app-header';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { usePathname } from 'next/navigation';
import { SplashScreen } from '../splash-screen';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { connected, isConnecting } = useWallet();
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  if (isConnecting) {
    return <SplashScreen />;
  }

  if (!connected) {
    return <WelcomeScreen />;
  }

  return (
    <div className="md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />

        <div className="relative flex flex-col md:min-h-screen">
            {isHomePage && <AppHeader />}
            <main className="flex-1">
                <div className="p-4 sm:p-6 pb-24 md:pb-6 h-full">
                    {children}
                </div>
            </main>
        </div>

        <BottomNav />
    </div>
  );
}
