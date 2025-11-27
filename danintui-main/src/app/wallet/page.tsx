
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Banknote, CreditCard, Activity, Droplets, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EarningsDashboard } from "@/components/profile/earnings-dashboard";
import Link from "next/link";

export default function WalletPage() {
    const { balance, balanceLoading, address, open, chain } = useWallet();
    const { toast } = useToast();
  
    const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Wallet & Earnings"
                description="Manage your funds, view your transaction history, and withdraw your earnings."
            />

            <Card className="bg-gradient-to-br from-card to-secondary border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-muted-foreground">Total Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        {balanceLoading ? (
                            <Skeleton className="h-[44px] w-48 bg-white/20" />
                        ) : (
                            <p className="text-5xl font-bold tracking-tight">{balance.toFixed(4)}</p>
                        )}
                        <span className="text-xl font-bold text-primary">{chain?.nativeCurrency.symbol}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 font-mono">{shortAddress}</p>
                </CardContent>
            </Card>

            <EarningsDashboard />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote />
                        Acquire $TRUST
                    </CardTitle>
                     <CardDescription>
                        Use these external platforms to swap for or bridge $TRUST tokens to the Intuition chain.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild variant="outline" className="w-full justify-between h-14 text-base">
                        <Link href="https://aerodrome.finance/swap?from=eth&to=0x6cd905df2ed214b22e0d48ff17cd4200c1c6d8a3&chain0=8453&chain1=8453" target="_blank" rel="noopener noreferrer">
                            <span>Swap on Aerodrome</span>
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground"/>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="w-full justify-between h-14 text-base">
                        <Link href="https://portal.intuition.systems/bridge" target="_blank" rel="noopener noreferrer">
                             <span>Bridge via Portal</span>
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground"/>
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
