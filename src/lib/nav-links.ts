export interface NavLink {
    href: string;
    icon: string; // Icon name from lucide-react
    label: string;
    group: 'main' | 'support';
    mobile: boolean;
    admin?: boolean;
}

export const navLinks: NavLink[] = [
    { href: '/', icon: 'Home', label: 'Home', group: 'main', mobile: true },
    { href: '/my-bets', icon: 'Crosshair', label: 'My Bets', group: 'main', mobile: true },
    { href: '/search', icon: 'Search', label: 'Oracle', group: 'main', mobile: false },
    { href: '/achievements', icon: 'Trophy', label: 'Merit', group: 'support', mobile: true },
    { href: '/wallet', icon: 'Wallet', label: 'Wallet', group: 'support', mobile: true },
    { href: '/admin', icon: 'Shield', label: 'Admin', group: 'main', mobile: false, admin: true },
    { href: '/settings', icon: 'UserCog', label: 'Identity', group: 'support', mobile: false },
    { href: '/help', icon: 'HelpCircle', label: 'Help', group: 'support', mobile: false },
]
