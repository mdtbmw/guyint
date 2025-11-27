
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Check, X, Trophy, AlertTriangle, LogOut, User, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getUserStats } from "./get-user-stats";
import { PageHeader } from "@/components/layout/page-header";


interface UserStats {
    wins: number;
    losses: number;
    accuracy: number;
    winnings: number;
    trustScore: number;
}

export default function ProfilePage() {
  const { address, connected, disconnectWallet } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

   useEffect(() => {
    if (connected && address) {
      const fetchUserStats = async () => {
        try {
          setLoading(true);
          const userStats = await getUserStats(address);
          setStats(userStats);
        } catch (error) {
          console.error("Failed to fetch user stats:", error);
           toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your on-chain profile data.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUserStats();
    }
  }, [connected, address, toast]);
  
  const handleDisconnect = () => {
    disconnectWallet();
    toast({
        title: "Wallet Disconnected",
        description: "You have been logged out."
    });
    router.push('/');
  }

  if (!connected) {
    return null;
  }

  return (
    <div className="space-y-6">
        <PageHeader 
          title="My Profile"
          description="Your on-chain betting statistics on the mainnet."
        />

       <Card>
          <CardHeader>
            <CardTitle>My Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                </div>
            ) : stats ? (
                <div className="space-y-4 text-base">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-white/70 flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-cyan-400"/> Trust Score</span>
                        <span className="font-bold text-xl text-cyan-400">{stats.trustScore}</span>
                    </div>
                     <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-white/70 flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-400"/> Total Winnings</span>
                        <span className="font-bold text-xl text-emerald-400">{stats.winnings.toFixed(2)} $T</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-white/70 flex items-center"><Check className="w-5 h-5 mr-2 text-emerald-500"/> Wins</span>
                        <span className="font-bold text-xl text-white/90">{stats.wins}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-white/70 flex items-center"><X className="w-5 h-5 mr-2 text-rose-500"/> Losses</span>
                        <span className="font-bold text-xl text-white/90">{stats.losses}</span>
                    </div>
                     <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                         <span className="font-medium text-white/70 flex items-center"><Award className="w-5 h-5 mr-2 text-indigo-400"/> Accuracy</span>
                        <span className="font-bold text-xl text-white/90">{stats.accuracy.toFixed(1)}%</span>
                    </div>
                </div>
            ) : (
                <p className="text-white/60">Could not load user statistics.</p>
            )}
          </CardContent>
           <CardFooter>
             <p className="text-xs text-white/50">Wallet: <span className="font-mono">{address}</span></p>
           </CardFooter>
        </Card>

        <Card className="border-destructive/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle />
                    Danger Zone
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-white/60 mb-4">
                   Disconnecting your wallet will log you out. Your betting history and stats are stored on the blockchain and will not be affected.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <LogOut className="mr-2 h-4 w-4" /> Disconnect Wallet
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                                This action will disconnect your wallet and log you out of the application.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="border-t border-white/10 pt-4">
                            <AlertDialogCancel className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-rose-600 text-white hover:bg-rose-500"
                                onClick={handleDisconnect}
                            >
                                Yes, Disconnect
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  );
}
