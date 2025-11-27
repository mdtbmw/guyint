
'use client';

import * as LucideIcons from 'lucide-react';
import React from 'react';

// A curated list of icons that are relevant for the application
// This list is now programmatically cleaned to ensure all icons are unique and valid.
const originalIconList = [
    'Activity', 'Airplay', 'Anchor', 'Award', 'Axe', 'Balance', 'Banknote',
    'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'Baseline', 'Bitcoin',
    'BrainCircuit', 'Building', 'Calendar', 'Camera', 'CandlestickChart', 'Car',
    'Castle', 'Cat', 'ChartArea', 'ChartLine', 'Cherry', 'ChevronDown', 'ChevronRight',
    'CircleDollarSign', 'Clapperboard', 'Cloud', 'Code', 'Cog', 'Coins', 'Compass',
    'Computer', 'Cookie', 'Cpu', 'Crown', 'Currency', 'Database', 'Diamond', 'Dog',
    'DollarSign', 'Dumbbell', 'Earth', 'Eye', 'Feather', 'Film', 'Filter', 'Flag',
    'Flame', 'Flashlight', 'FlaskConical', 'Flower', 'Football', 'Fuel', 'Gamepad2',
    'Gem', 'Ghost', 'Gift', 'GitBranch', 'Github', 'Globe', 'GraduationCap',
    'Grape', 'Grid', 'Hammer', 'Heart', 'HelpCircle', 'Home', 'Hourglass',
    'IceCream', 'Image', 'Infinity', 'Joystick', 'Key', 'Landmark', 'Languages',
    'LayoutGrid', 'Laptop', 'Leaf', 'Library', 'LifeBuoy', 'Lightbulb', 'LineChart', 'Link',
    'Lock', 'Magnet', 'Map', 'Medal', 'Menu', 'Megaphone', 'Mic', 'Milestone',
    'Moon', 'MoreHorizontal', 'Mouse', 'Music', 'Navigation', 'Newspaper', 'Palette', 'Paperclip',
    'Pen', 'Percent', 'PersonStanding', 'Phone', 'PieChart', 'PiggyBank', 'Pilcrow',
    'Pizza', 'Plane', 'Plus', 'Plug', 'Pocket', 'Podcast', 'Power', 'Presentation', 'Printer',
    'Puzzle', 'Quote', 'Radio', 'Recycle', 'Rocket', 'Rss', 'Save', 'Scale', 'School',
    'Scissors', 'ScreenShare', 'Search', 'Send', 'Server', 'Settings', 'Shield',
    'ShieldCheck', 'Ship', 'Signal', 'Smartphone', 'Sprout', 'Star', 'Store', 'Sun', 'Sword',
    'Table', 'Tablet', 'Tag', 'Target', 'Tent', 'Terminal', 'Ticket', 'ToggleLeft',
    'Train', 'Trash', 'TrendingUp', 'Trophy', 'Truck', 'Tv', 'Umbrella', 'Unlink',
    'Unlock', 'Upload', 'User', 'Users', 'Video', 'Vote', 'Wallet', 'Watch', 'Box',
    'Wifi', 'Wind', 'Wine', 'Wrench', 'X', 'Zap', 'QrCode'
];

// Use a Set to ensure all icons in the list are unique, then convert back to an array.
export const iconList = [...new Set(originalIconList)];


export const DynamicIcon = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;

  if (!Icon) {
    // Fallback to a default icon if the specified one doesn't exist
    return <LucideIcons.HelpCircle {...props} />;
  }
  return <Icon {...props} />;
};

    