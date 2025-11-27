
'use client';

import { Home, Ticket, User, LifeBuoy, Shield, Search, Banknote, Rocket, Settings, Menu } from 'lucide-react';
import React from 'react';

export interface NavLink {
    href: string;
    icon: React.ReactNode;
    label: string;
    group: 'main' | 'admin' | 'support';
    mobile: boolean;
    admin?: boolean;
}

export const navLinks: NavLink[] = [
    { href: '/', icon: <Home />, label: 'Home', group: 'main', mobile: true },
    { href: '/search', icon: <Search />, label: 'Search', group: 'main', mobile: true },
    { href: '/my-bets', icon: <Ticket />, label: 'My Bets', group: 'main', mobile: true },
    { href: '/wallet', icon: <Banknote />, label: 'Wallet', group: 'main', mobile: false },
    { href: '/boosts', icon: <Rocket />, label: 'Boosts', group: 'main', mobile: false },
    { href: '/profile', icon: <User />, label: 'Profile', group: 'main', mobile: true },
    { href: '/admin', icon: <Shield />, label: 'Admin', group: 'main', mobile: false, admin: true },
    { href: '/help', icon: <LifeBuoy />, label: 'Help', group: 'support', mobile: false },
    { href: '/settings', icon: <Settings />, label: 'Settings', group: 'support', mobile: false },
]
