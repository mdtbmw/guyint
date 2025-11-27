
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
import { Banknote, CreditCard, Activity, ExternalLink, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";

export default function WalletPage() {
    const { balance, balanceLoading, address } = useWallet();
    const { toast } = useToast();
  
    const handleAction = (action: string) => {
      toast({
        title: "Feature Not Implemented",
        description: `The "${action}" functionality is for demonstration purposes.`,
      })
    }

    return (
        <div className="space-y-8">
             <MobilePageHeader title="Wallet" />
             <div className="hidden md:block">
                <PageHeader 
                    title="Wallet & Funds"
                    description="Manage your $TRUST tokens and view your transaction history."
                />
             </div>

            <Card className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-white/80">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    {balanceLoading ? (
                        <Skeleton className="h-[60px] w-48 bg-white/20" />
                    ) : (
                        <p className="text-5xl font-bold tracking-tight">{balance.toFixed(2)}</p>
                    )}
                    <p className="text-lg text-white/90 mt-1">$TRUST</p>
                    <p className="text-xs text-white/60 mt-4 font-mono">{address}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Funding
                    </CardTitle>
                     <CardDescription>
                        Add real funds to your wallet to start betting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-between" onClick={() => handleAction('Buy with Card')}>
                        <span>Buy with Card</span>
                        <CreditCard className="w-5 h-5 text-muted-foreground"/>
                    </Button>
                     <Button variant="outline" className="w-full justify-between" onClick={() => handleAction('Bridge from another network')}>
                        <span>Bridge from another network</span>
                        <Activity className="w-5 h-5 text-muted-foreground"/>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
