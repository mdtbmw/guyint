'use client';

import {
  Bell,
  Wallet,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Notification } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { SidebarTrigger } from '../ui/sidebar';

export function AppHeader() {
  const { address, balance, balanceLoading } = useWallet();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // In a real app, notifications would come from a service
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  
  return (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <DialogTrigger asChild>
                <button
                className="relative rounded-xl bg-white/5 p-2 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]"
                aria-label="Notifications"
                >
                <Bell className="h-5 w-5 text-white/90" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                )}
                </button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900/80 border-neutral-700 text-white w-[85%] max-w-sm rounded-2xl backdrop-blur-lg">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-white">Notifications</DialogTitle>
                </DialogHeader>
                <div className="divide-y divide-white/5">
                    <div className="text-center text-sm text-white/60 p-8">
                        You have no new notifications.
                    </div>
                </div>
            </DialogContent>
            </Dialog>
        </div>
        <div className="flex items-center gap-3">
            <button
            onClick={() => router.push('/wallet')}
            className="group flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]"
            aria-label="Wallet"
            >
            <Wallet className="h-5 w-5 text-white/90" />
            {balanceLoading ? 
                <Skeleton className="h-4 w-16 bg-white/10" /> :
                <span className="text-[12px] font-medium text-white/90 group-hover:text-white">
                    {balance.toFixed(2)} $TRUST
                </span>
            }
            </button>
            <Avatar className="h-9 w-9 cursor-pointer rounded-full object-cover ring-2 ring-white/10" onClick={() => router.push('/profile')}>
            <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
            />
            <AvatarFallback>{address?.slice(2, 4)}</AvatarFallback>
            </Avatar>
        </div>
    </div>
  );
}
