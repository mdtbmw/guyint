
import type { Achievement, UserStats } from '@/lib/types';

// Updated descriptions to be more concise for the new UI
export const achievements: Achievement[] = [
  { 
    id: "first_win",
    name: "Genesis", 
    description: "Founding Member", 
    icon: "Gem", 
    image: "",
    criteria: (stats: UserStats) => stats.wins >= 1,
    progress: (stats: UserStats) => stats.wins,
    goal: () => 1,
  },
  { 
    id: "hot_streak",
    name: "Consistent Winner", 
    description: "Achieve 5 wins", 
    icon: "Flame", 
    image: "",
    criteria: (stats: UserStats) => stats.wins >= 5,
    progress: (stats: UserStats) => stats.wins,
    goal: () => 5,
  },
  { 
    id: "intuitive",
    name: "Intuitive", 
    description: "Trust Score > 100", 
    icon: "BrainCircuit", 
    image: "",
    criteria: (stats: UserStats) => (stats.trustScore ?? 0) >= 100,
    progress: (stats: UserStats) => stats.trustScore ?? 0,
    goal: () => 100,
  },
  { 
    id: "sharp_predictor",
    name: "Oracle", 
    description: "10 Straight Wins", 
    icon: "Eye", 
    image: "",
    criteria: (stats: UserStats) => stats.accuracy >= 75 && stats.totalBets >= 10,
    progress: (stats: UserStats) => stats.totalBets < 10 ? stats.totalBets : stats.accuracy,
    goal: (stats: UserStats | null) => (stats && stats.totalBets < 10) ? 10 : 75,
   },
   {
    id: "whale_slayer",
    name: "Whale Slayer",
    description: "Win > $50k",
    icon: "Sword",
    image: "",
    criteria: (stats: UserStats) => false, // This would require tracking winnings
    progress: (stats: UserStats) => 0,
    goal: () => 50000,
   }
];

    