
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
    { href: '/search', icon: 'Search', label: 'Oracle Search', group: 'main', mobile: false },
    { href: '/leaderboard', icon: 'Trophy', label: 'Rankings', group: 'main', mobile: true },
    { href: '/achievements', icon: 'Award', label: 'Artifacts', group: 'main', mobile: true },
    { href: '/my-ledger', icon: 'BookOpen', label: 'My Ledger', group: 'main', mobile: false },
    { href: '/wallet', icon: 'Wallet', label: 'Wallet', group: 'support', mobile: false },
    { href: '/admin', icon: 'Shield', label: 'Control Matrix', group: 'main', mobile: false, admin: true },
    { href: '/settings', icon: 'UserCog', label: 'Identity', group: 'main', mobile: true },
    { href: '/help', icon: 'HelpCircle', label: 'Help', group: 'support', mobile: false },
]

    