
'use client';

import { useWallet } from '@/hooks/use-wallet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DynamicIcon } from '@/lib/icons';
import Link from 'next/link';
import { useSettings } from '@/lib/state/settings';
import { Logo } from '../ui/logo';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ArrowLeft, Menu, X, MoreVertical, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '../ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useNotifications } from '@/lib/state/notifications';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNowStrict } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useHeaderState } from '@/lib/state/header';
import { UserProfileStats } from '../profile/user-profile-stats';
import { navLinks } from '@/lib/nav-links';

const NON_ROOT_PATHS = ['/event', '/admin', '/create-event'];

const MobileNavMenu = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const pathname = usePathname();
    const { isAdmin } = useAdmin();
    const { theme, setTheme } = useTheme();

    const mobileDockHrefs = navLinks.filter(l => l.mobile).map(l => l.href);
    const allLinks = navLinks.filter(l => !mobileDockHrefs.includes(l.href) && (!l.admin || isAdmin));


    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
             <SheetContent side="right" className="w-full max-w-full bg-obsidian/95 backdrop-blur-xl rounded-none border-none p-0 m-0">
                 <VisuallyHidden><SheetTitle>Main Menu</SheetTitle></VisuallyHidden>
                 <div className="p-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group" onClick={() => onOpenChange(false)}>
                        <Logo className="h-9 w-9 text-foreground"/>
                    </Link>
                </div>
                <nav className="flex flex-col p-8 gap-2">
                    {allLinks.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => onOpenChange(false)}
                                className={cn(
                                    "flex items-center gap-4 py-4 text-2xl font-bold font-display transition-colors",
                                    isActive ? "text-gold-500" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <DynamicIcon name={link.icon} className="w-7 h-7" strokeWidth={2}/>
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-8 mt-auto">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">Appearance</p>
                    <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-border p-1">
                        <button type="button" onClick={() => setTheme('light')} className={cn("flex-1 h-10 flex items-center justify-center gap-2 rounded-md text-sm font-medium", theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
                            <Sun className="w-4 h-4"/>
                            Light
                        </button>
                        <button type="button" onClick={() => setTheme('dark')} className={cn("flex-1 h-10 flex items-center justify-center gap-2 rounded-md text-sm font-medium", theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                            <Moon className="w-4 h-4"/>
                            Dark
                        </button>
                    </div>
                </div>

            </SheetContent>
        </Sheet>
    )
}

const NotificationPanelContent = () => {
    const { notifications, clearAllNotifications } = useNotifications();
    return (
        <>
             <DialogTitle className="font-display font-bold text-lg text-foreground">Notifications</DialogTitle>
             {notifications.length > 0 &&
                    <button onClick={clearAllNotifications} className="absolute right-12 top-5 text-[10px] font-bold uppercase tracking-wider text-gold-500 hover:text-gold-400 transition-colors">Clear</button>
                }
            <ScrollArea className="max-h-[300px] overflow-y-auto no-scrollbar -mx-6 px-6">
                <div className="space-y-3">
                {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer flex gap-3 border border-transparent hover:border-primary/20">
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-gold-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>}
                        <div className={cn(!notif.read && "pl-0", notif.read && "pl-4")}>
                            <p className="text-sm font-bold text-foreground mb-0.5">{notif.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1.5">{formatDistanceToNowStrict(notif.timestamp, {addSuffix: true})}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-xs text-zinc-500 py-8">No notifications yet.</p>
                )}
                </div>
            </ScrollArea>
        </>
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

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings } = useSettings();
  const { address, disconnect } = useWallet();

  const { markAllAsRead, unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { title, subtitle } = useHeaderState();
  const isInnerPage = pathname !== '/';


  useEffect(() => {
    if (isNotificationsOpen) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isNotificationsOpen, markAllAsRead]);
  
  const notificationTrigger = (
    <DialogTrigger asChild>
      <button className="relative p-2 rounded-full bg-card hover:bg-accent">
        <Bell className="w-5 h-5 text-muted-foreground" strokeWidth="1.5" />
        {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background shadow-sm flex items-center justify-center text-white text-[8px] font-bold"></span>
        )}
      </button>
    </DialogTrigger>
  );

  if (isMobile === undefined) {
    return null; 
  }


  if (isMobile) {
      return (
        <>
         <header className={cn(
             "md:hidden flex items-center justify-between p-4 h-20 bg-background/80 backdrop-blur-xl sticky top-0 z-30 rounded-b-2xl border-b border-border"
         )}>
            {/* Left Icon */}
            <div className="w-10">
                {isInnerPage ? (
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setIsMenuOpen(true)}>
                        <MoreVertical className="w-5 h-5 text-gold-500"/>
                    </Button>
                )}
            </div>

            {/* Centered Content */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              {isInnerPage && title ? (
                <div>
                    <h1 className="text-base font-bold text-foreground truncate max-w-[200px]">{title}</h1>
                    {subtitle && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{subtitle}</p>}
                </div>
              ) : (
                <Link href="/" className="flex items-center gap-3">
                    <Logo className="h-8 w-8 text-foreground" />
                </Link>
              )}
            </div>
            

            {/* Right Icons */}
            <div className="flex items-center gap-2">
                <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                    {notificationTrigger}
                     <DialogContent className="sm:max-w-[425px] w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-xl rounded-[2rem] p-6">
                        <NotificationPanelContent />
                    </DialogContent>
                </Dialog>

                 <Dialog>
                    <DialogTrigger asChild>
                         <button className="h-9 w-9 rounded-full p-0.5 cursor-pointer">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${settings.username || address}`} alt="User Avatar" />
                                <AvatarFallback>{address?.slice(2,4) || '??'}</AvatarFallback>
                            </Avatar>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-card/80 backdrop-blur-xl rounded-[2.5rem]">
                        <AccountModalContent />
                    </DialogContent>
                </Dialog>
            </div>
        </header>
        <MobileNavMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
       </>
      );
  }

  // Fallback for non-mobile (which is an empty header, as desktop is handled by sidebar)
  return null;
}
