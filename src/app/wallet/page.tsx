
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
import { Banknote, CreditCard, Droplets, Landmark, History, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { blockchainService } from "@/services/blockchain";

export default function WalletPage() {
    const { balance, balanceLoading, address, fetchBalance } = useWallet();
    const { toast } = useToast();
    const [isFaucetLoading, setIsFaucetLoading] = useState(false);

    const handleFaucet = async () => {
        if (!address) return;
        setIsFaucetLoading(true);
        try {
            // This is a simulated transaction to a non-existent faucet contract
            // In a real testnet, this would call a faucet contract's `requestTokens` function
            const txHash = await blockchainService.faucet(address);
            toast({
                title: "Faucet Request Sent",
                description: `Waiting for transaction confirmation... Tx: ${txHash.slice(0, 10)}...`
            });
            await blockchainService.waitForTransaction(txHash);
            
            toast({
                title: "Success!",
                description: "100 Testnet $TRUST has been sent to your wallet.",
            });
            // Trigger a balance refresh
            if (address) {
                fetchBalance(address);
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Faucet Failed",
                description: "Could not get test tokens. This is a simulated transaction and may fail if the network is busy.",
            });
        } finally {
            setIsFaucetLoading(false);
        }
    }
  
    const handleAction = (action: string) => {
      toast({
        title: "Feature Not Implemented",
        description: `The "${action}" functionality is for demonstration purposes.`,
      })
    }

    return (
        <div className="space-y-8">
             <PageHeader 
                title="Wallet & Funds"
                description="Manage your $TRUST tokens and view your transaction history."
             />

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
                        <Landmark className="w-5 h-5" />
                        Funding
                    </CardTitle>
                     <CardDescription>
                        Get test tokens or add real funds to your wallet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2 p-4 border rounded-lg border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center gap-2">
                             <Droplets className="w-5 h-5 text-blue-400" />
                             <h3 className="font-semibold">Testnet Faucet</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Get free $TRUST tokens to use on the platform for testing. Each click will send 100 $TRUST to your connected wallet.
                        </p>
                        <Button onClick={handleFaucet} disabled={isFaucetLoading || !address} className="w-full bg-blue-500 hover:bg-blue-400 text-white">
                            {isFaucetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isFaucetLoading ? "Requesting Tokens..." : "Get 100 $TRUST"}
                        </Button>
                    </div>

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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <p>No transactions yet.</p>
                        <p className="text-sm">Your recent deposits and withdrawals will appear here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
