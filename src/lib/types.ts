
import type { Hex } from "viem";

export type UserTier = "Rookie" | "Analyst" | "Intuitive" | "Oracle";

export type Category = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
}

export type EventStatus = "open" | "closed" | "finished" | "canceled";
export type BetOutcome = "YES" | "NO";

export type Event = {
  id: string;
  question: string;
  description?: string; // Optional description for more context
  category: string;
  imageUrl?: string; // Optional image URL
  status: EventStatus;
  outcomes: {
    yes: number;
    no: number;
  };
  totalPool: number;
  participants: Hex[];
  startDate: Date | null;
  bettingStopDate: Date | null;
  resolutionDate: Date | null;
  winningOutcome?: BetOutcome;
  minStake: number;
  maxStake: number;
};

export type Bet = {
  id: string; // transaction hash
  eventId: string;
  eventQuestion: string;
  userBet: BetOutcome;
  stakedAmount: number;
  date: Date;
  outcome: "Won" | "Lost" | "Pending" | "Refunded" | "Claimed" | "Refundable";
  winnings?: number;
};

export type PnLBet = Bet & {
  pnl: number;
};


export type AdminRole = "Super Admin" | "Event Creator" | "Oracle";
export type AdminAction = "Created Signal" | "Canceled Signal" | "Declared Outcome";

export type AdminLog = {
  id: string;
  admin: string; // Wallet address
  role: AdminRole;
  action: AdminAction;
  timestamp: Date;
  eventId?: string;
  targetAdmin?: string;
  newRole?: AdminRole;
  oldRole?: AdminRole;
};

export type LeaderboardUser = {
  id: string;
  walletAddress: string;
  username: string;
  avatar: string;
  value: number;
}

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  criteria: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => number;
  goal: (stats: UserStats | null) => number;
}

export type NotificationVariant = "default" | "success" | "destructive";
export type NotificationCategory = 'onBetPlaced' | 'onEventResolved' | 'onWinningsClaimed';

export type NotificationType = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string; // Lucide icon name
  read: boolean;
  href?: string;
  variant?: NotificationVariant;
  type: NotificationCategory | 'general';
};

export interface UserStats {
    wins: number;
    losses: number;
    totalBets: number;
    accuracy: number;
    trustScore: number;
}

    