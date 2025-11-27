
import * as LucideIcons from 'lucide-react';
import { BrainCircuit } from 'lucide-react';
import React from 'react';

// A curated list of icons that are relevant for the application
export const iconList = [
    'Activity', 'Airplay', 'Anchor', 'Award', 'Axe', 'Balance', 'Banknote',
    'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'Baseline', 'Bitcoin',
    'BrainCircuit', 'Building', 'Calendar', 'Camera', 'CandlestickChart', 'Car',
    'Castle', 'Cat', 'ChartArea', 'ChartLine', 'Cherry', 'ChevronDown',
    'CircleDollarSign', 'Clapperboard', 'Cloud', 'Code', 'Cog', 'Coins', 'Compass',
    'Computer', 'Cookie', 'Cpu', 'Crown', 'Currency', 'Database', 'Diamond', 'Dog',
    'DollarSign', 'Dumbbell', 'Earth', 'Feather', 'Film', 'Filter', 'Flag',
    'Flame', 'Flashlight', 'FlaskConical', 'Flower', 'Football', 'Fuel', 'Gamepad2',
    'Gem', 'Ghost', 'Gift', 'GitBranch', 'Github', 'Globe', 'GraduationCap',
    'Grape', 'Grid', 'Hammer', 'Heart', 'HelpCircle', 'Home', 'Hourglass',
    'IceCream', 'Image', 'Infinity', 'Joystick', 'Key', 'Landmark', 'Languages',
    'Laptop', 'Leaf', 'Library', 'LifeBuoy', 'Lightbulb', 'LineChart', 'Link',
    'Lock', 'Magnet', 'Map', 'Medal', 'Menu', 'Megaphone', 'Menu', 'Mic', 'Milestone',
    'Moon', 'Mouse', 'Music', 'Navigation', 'Newspaper', 'Palette', 'Paperclip',
    'Pen', 'Percent', 'PersonStanding', 'Phone', 'PieChart', 'PiggyBank', 'Pilcrow',
    'Pizza', 'Plane', 'Plug', 'Pocket', 'Podcast', 'Power', 'Presentation', 'Printer',
    'Puzzle', 'Quote', 'Radio', 'Recycle', 'Rocket', 'Save', 'Scale', 'School',
    'Scissors', 'ScreenShare', 'Search', 'Send', 'Server', 'Settings', 'Shield',
    'Ship', 'Signal', 'Smartphone', 'Sprout', 'Star', 'Store', 'Sun', 'Sword',
    'Table', 'Tablet', 'Tag', 'Target', 'Tent', 'Terminal', 'Ticket', 'ToggleLeft',
    'Train', 'Trash', 'TrendingUp', 'Trophy', 'Truck', 'Tv', 'Umbrella', 'Unlink',
    'Unlock', 'Upload', 'User', 'Users', 'Video', 'Vote', 'Wallet', 'Watch',
    'Wifi', 'Wind', 'Wine', 'Wrench', 'Zap'
];


export const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) {
    return <BrainCircuit className={className || "w-5 h-5"} />;
  }
  return React.createElement(Icon, { className: className || "w-5 h-5" });
};
