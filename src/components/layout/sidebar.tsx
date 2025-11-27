
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/use-admin';
import type { NavLink } from '@/lib/nav-links';
import { Skeleton } from '../ui/skeleton';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { useTheme } from 'next-themes';
import { DynamicIcon } from '@/lib/icons';
import { useWallet } from '@/hooks/use-wallet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotifications } from '@/lib/state/notifications';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNowStrict } from 'date-fns';
import { useSettings } from '@/lib/state/settings';
import { navLinks } from '@/lib/nav-links';
import { Logo } from '../ui/logo';
import { Sun, Moon, LogOut } from 'lucide-react';
import { UserProfileStats } from '../profile/user-profile-stats';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';


const NotificationPanel = () => {
    const { notifications, clearAllNotifications, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                markAllAsRead();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, markAllAsRead]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <button className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all relative overflow-hidden w-full">
                    <div className="relative">
                        <DynamicIcon name="Bell" className="w-5 h-5 min-w-[1.25rem]" strokeWidth="1.5" />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-card shadow-sm"></span>
                        )}
                    </div>
                    <span className="sidebar-text font-medium text-sm">Notifications</span>
                </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-80 glass-panel rounded-[2rem] p-5">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-display font-bold text-lg text-foreground">Notifications</h3>
                    {notifications.length > 0 && 
                        <button onClick={clearAllNotifications} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">Clear</button>
                    }
                </div>
                
                <ScrollArea className="max-h-[400px] overflow-y-auto no-scrollbar">
                  <div className="space-y-3">
                    {notifications.length > 0 ? notifications.map(notif => (
                       <div key={notif.id} className="p-3 rounded-2xl bg-secondary hover:bg-accent transition-colors cursor-pointer flex gap-3 border border-transparent hover:border-primary/20">
                          {notif.read ? <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 shrink-0"></div> : <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_hsl(var(--primary))]"></div>}
                          <div>
                              <p className="text-sm font-bold text-foreground mb-0.5">{notif.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5">{formatDistanceToNowStrict(notif.timestamp, {addSuffix: true})}</p>
                          </div>
                      </div>
                    )) : (
                       <p className="text-center text-xs text-muted-foreground py-8">No notifications yet.</p>
                    )}
                  </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}


const AccountModalContent = () => {
    const { address, disconnect } = useWallet();
    const { settings } = useSettings();
    const username = settings.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "User");

    return (
        <div className="p-2">
            <VisuallyHidden>
              <DialogTitle>Account Details</DialogTitle>
            </VisuallyHidden>
             <div className="flex flex-col items-center text-center">
                 <div className="relative w-36 h-36 shrink-0">
                    <svg className="absolute inset-0" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" fill="none" r="56" stroke="hsl(var(--secondary))" strokeWidth="8"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="w-28 h-28 border-4 border-background">
                            <AvatarImage src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${settings.username || address}`} alt="User Avatar" />
                            <AvatarFallback>{username.slice(0,2) || '??'}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-display mt-4">{username}</h2>
                <p className="text-sm text-muted-foreground font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</p>
            </div>
            
            <div className="my-6">
                <UserProfileStats />
            </div>

            <button onClick={() => disconnect()} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold hover:bg-destructive hover:text-white transition-colors active-press">
                <LogOut className="w-4 h-4"/>
                Disconnect
            </button>
        </div>
    )
}

const AccountPanel = () => {
    const { address } = useWallet();
    const { settings } = useSettings();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex-1 flex items-center gap-4 p-3 rounded-xl relative overflow-hidden hover:bg-accent text-muted-foreground">
                    <Avatar className="h-8 w-8 min-w-[2rem] border-2 border-border">
                        <AvatarImage src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${settings.username || address}`} alt="User Avatar" />
                        <AvatarFallback>{address?.slice(2,4) || '??'}</AvatarFallback>
                    </Avatar>
                    <div className="sidebar-text text-sm text-left">
                        <p className="font-bold text-foreground font-display">{settings.username || `${address?.slice(0, 6)}...${address?.slice(-4)}`}</p>
                        <p className="text-xs">Manage Account</p>
                    </div>
                </button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-card/80 backdrop-blur-xl rounded-[2.5rem]">
                <AccountModalContent />
            </DialogContent>
        </Dialog>
    )
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const renderLink = (link: NavLink, index: number) => {
    if (link.admin && !isAdmin) return null;
    if (link.admin && adminLoading) return <Skeleton key={index} className="h-[50px] w-full rounded-2xl bg-secondary" />;
    
    const isActive = pathname === link.href;

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          'flex items-center gap-4 p-3.5 rounded-2xl transition-all relative overflow-hidden',
          isActive
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'hover:bg-accent text-muted-foreground hover:text-foreground',
        )}
      >
        {isActive && <div className="w-1 h-5 bg-primary rounded-full absolute left-0"></div>}
        <DynamicIcon name={link.icon} className="w-5 h-5 min-w-[1.25rem]" strokeWidth="1.5" />
        <span className="sidebar-text font-medium text-sm">{link.label}</span>
      </Link>
    );
  };

  const mainNav = navLinks.filter(l => l.group === 'main');
  const supportNav = navLinks.filter(l => l.group === 'support');

  if (!isMounted) {
    return (
      <aside className="hidden lg:block shrink-0 w-20" />
    );
  }

  return (
    <aside className="hidden lg:flex w-20 flex-col fixed left-3 top-0 bottom-0 h-[96vh] my-auto z-50 bg-card/80 backdrop-blur-2xl rounded-[2.5rem] border border-border/60 dark:border-white/10 shadow-2xl shadow-black/60 sidebar-transition group relative overflow-hidden">
        <div className="flex flex-col h-full w-64">
            <div className="h-24 flex items-center px-5 gap-4 border-b border-transparent group-hover:border-border transition-colors shrink-0">
                <div className="h-10 w-10 min-w-[2.5rem] p-1.5 bg-foreground text-background flex items-center justify-center font-display font-bold text-xl rounded-2xl shadow-lg">
                    <Logo />
                </div>
                <span className="sidebar-text font-display font-bold text-lg tracking-tight text-foreground">INTUITION BETs</span>
            </div>

            <nav className="flex-1 flex flex-col gap-2 py-6 px-3 overflow-y-auto no-scrollbar">
                {mainNav.map(renderLink)}
                <NotificationPanel />
                <div className="h-px w-full bg-border my-2 group-hover:mx-2 transition-all"></div>
                {supportNav.map(renderLink)}
            </nav>

            <div className="p-3 border-t border-transparent group-hover:border-border transition-colors bg-background/20 dark:bg-black/20 backdrop-blur-sm shrink-0 flex items-center gap-2">
                <AccountPanel />
                 <button onClick={toggleTheme} className="h-14 w-14 min-w-[3.5rem] flex-shrink-0 flex items-center justify-center rounded-xl relative overflow-hidden hover:bg-accent text-muted-foreground">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </button>
            </div>
        </div>
    </aside>
  );
}
