'use client';

import { useWallet } from '@/hooks/use-wallet';
import { WelcomeScreen } from '@/components/welcome-screen';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { AppHeader } from './app-header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { SidebarProvider } from '../ui/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const pathname = usePathname();
  const isDashboard = pathname === '/';

  if (!connected) {
    return <WelcomeScreen />;
  }

  return (
    <SidebarProvider>
      <div className="md:flex md:h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col md:h-screen overflow-hidden">
          <header className={cn(
            "sticky top-0 z-20 w-full bg-neutral-950/80 backdrop-blur-lg md:bg-transparent md:backdrop-blur-none",
            isDashboard ? '' : 'md:bg-neutral-950/80 md:backdrop-blur-lg'
          )}>
             <div className={cn(
               "px-4 py-3 md:py-4"
             )}>
              <AppHeader />
            </div>
          </header>
          <main className={cn(
            "flex-1 w-full px-4 md:px-8 overflow-y-auto no-scrollbar pb-24 md:pb-8",
             isDashboard ? "pt-0 md:pt-4" : "pt-2 md:pt-4"
            )}>
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
