
'use client';

import { PnLBet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const getOutcomeBadge = (bet: PnLBet) => {
    switch (bet.outcome) {
      case "Won":
        return <Badge className="bg-emerald-500/10 text-emerald-500 font-bold border-emerald-500/20">WIN</Badge>;
      case "Claimed":
        return <Badge className="bg-emerald-500/20 text-emerald-600 font-bold border-emerald-500/30">WIN</Badge>;
      case "Lost":
        return <Badge className="bg-rose-500/10 text-rose-500 font-bold border-rose-500/20">LOSS</Badge>;
      case "Pending":
        return <Badge className="bg-primary/10 text-primary font-bold border-primary/20">OPEN</Badge>;
      case "Refundable":
      case "Refunded":
        return <Badge variant="secondary" className="text-muted-foreground border-border">REFUND</Badge>;
    }
};

interface BetCardProps {
    bet: PnLBet;
    onAction: (bet: PnLBet) => void;
    actionLoading: boolean;
}

export function BetCard({ bet, onAction, actionLoading }: BetCardProps) {
    const router = useRouter();

    return (
        <div className={cn("bg-card rounded-2xl border p-4 space-y-4", 
            bet.outcome === 'Won' || bet.outcome === 'Claimed' ? "border-emerald-500/20" :
            bet.outcome === 'Lost' ? "border-rose-500/20" :
            "border-border"
        )}>
            <div className="flex justify-between items-start">
                <p className="font-bold text-foreground pr-4">{bet.eventQuestion}</p>
                {getOutcomeBadge(bet)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Position</p>
                    <p className={cn("font-bold", bet.userBet === 'YES' ? 'text-emerald-500' : 'text-rose-500')}>{bet.userBet}</p>
                </div>
                 <div className="text-right">
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Stake</p>
                    <p className="font-bold text-foreground">${bet.stakedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">PnL</p>
                    <p className={cn("font-bold", bet.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                        {bet.pnl >= 0 ? '+' : ''}${bet.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                 <div className="text-right">
                     {(bet.outcome === "Won" || bet.outcome === "Refundable") ? (
                        <Button size="sm" variant="secondary" onClick={() => onAction(bet)} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Claim'}
                        </Button>
                    ) : (
                         <Button size="sm" variant="ghost" onClick={() => router.push(`/event/${bet.eventId}`)}>
                            View Signal <LinkIcon className="w-3 h-3 ml-2 text-muted-foreground" />
                        </Button>
                    )}
                 </div>
            </div>
        </div>
    )
}
