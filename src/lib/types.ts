
import { Timestamp } from "firebase/firestore";
import { Hex } from "viem";

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
  category: string;
  status: EventStatus;
  outcomes: {
    yes: number;
    no: number;
  };
  totalPool: number;
  participants: Hex[];
  endDate: Date;
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

export type AdminRole = "Super Admin" | "Event Creator" | "Oracle";
export type AdminAction = "Created Event" | "Canceled Event" | "Declared Outcome";

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
  icon: string;
}

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  read: boolean;
};

// UserProfile is no longer needed as we source all data from on-chain
