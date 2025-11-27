
'use client';

import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Flame, Gem, Star, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Leaderboard } from "@/components/leaderboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { DynamicIcon } from "@/lib/icons";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { blockchainService } from "@/services/blockchain";
import { Hex } from "viem";

interface UserStats {
    wins: number;
    losses: number;
    totalBets: number;
    accuracy: number;
    trustScore: number;
}

const getTier = (score: number) => {
    if (score < 10) return { tier: "Rookie", color: "bg-gray-500" };
    if (score < 50) return { tier: "Analyst", color: "bg-blue-500" };
    if (score < 150) return { tier: "Intuitive", color: "bg-indigo-500" };
    return { tier: "Oracle", color: "bg-yellow-500" };
}

const achievements = [
    { name: "First Win", description: "First correct prediction", icon: "Award", image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=2070&auto=format&fit=crop" },
    { name: "Hot Streak", description: "5 wins in a row", icon: "Flame", image: "https://images.unsplash.com/photo-1533109721025-d1ae7de7c784?q=80&w=2070&auto=format&fit=crop" },
    { name: "Top 10%", description: "Ranked in the top 10%", icon: "Gem", image: "https://images.unsplash.com/photo-1616425126210-aa5d44893c56?q=80&w=1932&auto=format&fit=crop" },
    { name: "Prophet", description: "Predicted a long shot", icon: "Star", image: "https://images.unsplash.com/photo-1534705 passionately-5111a6b5398?q=80&w=1964&auto=format&fit=crop" },
]

export default function ProfilePage() {
  const { address, connected, balance, balanceLoading } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = useMemo(() => {
    if (!address) return "Not Connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const fetchUserStats = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
        const onChainHistory = await blockchainService.getUserHistory(address as Hex);
        const wins = Number(onChainHistory.wins);
        const losses = Number(onChainHistory.losses);
        const totalBets = wins + losses;
        const accuracy = totalBets > 0 ? (wins / totalBets) * 100 : 0;
        const trustScore = (wins * 5) - (losses * 2); // Example scoring

        setStats({ wins, losses, totalBets, accuracy, trustScore });
    } catch (e: any) {
      const errorMessage = e.message || "Could not load your on-chain profile data. Please try again.";
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: "Data Fetch Error",
        description: "Failed to fetch profile and on-chain stats."
      })
    } finally {
      setLoading(false);
    }
  }, [address, toast]);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    } else {
        fetchUserStats();
    }
  }, [connected, router, fetchUserStats]);

  const userTier = useMemo(() => {
      if (!stats) return { tier: "Rookie", color: "bg-gray-500" };
      return getTier(stats.trustScore);
  }, [stats]);
  
  if (loading) {
    return (
        <div className="space-y-6">
            <MobilePageHeader title="My Profile" />
            <Skeleton className="h-10 w-48" />
            <div className="flex items-center gap-4">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    )
  }
  
  const accuracy = stats?.accuracy ?? 0;

  return (
    <div className="space-y-6">
        <MobilePageHeader title="My Profile" />
        <div className="hidden md:block">
          <PageHeader 
            title="My Profile"
            description="Your on-chain identity and prediction history."
          />
        </div>
        
        <div className="flex p-4 @container">
            <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
                <div className="flex gap-4 items-center">
                    <div className="relative w-32 h-32 shrink-0">
                        <svg className="absolute inset-0" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" fill="none" r="56" stroke="hsl(var(--component-light-dark))" strokeWidth="8"></circle>
                            <circle 
                                className="transform -rotate-90 origin-center transition-all duration-1000" 
                                cx="60" cy="60" fill="none" r="56" 
                                stroke="hsl(var(--primary))" 
                                strokeDasharray={352} 
                                strokeDashoffset={352 - (352 * accuracy) / 100} 
                                strokeLinecap="round" strokeWidth="8"
                            ></circle>
                        </svg>
                        <div className="absolute inset-2 bg-center bg-no-repeat aspect-square bg-cover rounded-full" style={{backgroundImage: `url(https://api.dicebear.com/7.x/pixel-art/svg?seed=${address})`}}></div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">{username}</p>
                        <p className="text-text-dark text-base font-normal leading-normal">{userTier.tier} Predictor</p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => router.push('/my-bets')} className="bg-component-light-dark w-full @[480px]:w-auto">View History</Button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4">
            <div className="flex flex-col gap-2 rounded-xl p-4 bg-component-dark/40 border border-border">
                <p className="text-text-dark text-sm font-medium leading-normal">$TRUST Balance</p>
                {balanceLoading ? <Skeleton className="h-8 w-24"/> : <p className="text-white tracking-light text-2xl font-bold leading-tight">{balance.toFixed(2)}</p>}
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-4 bg-component-dark/40 border border-border">
                <p className="text-text-dark text-sm font-medium leading-normal">Accuracy</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-4 bg-component-dark/40 border border-border">
                <p className="text-text-dark text-sm font-medium leading-normal">Total Bets</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">{stats?.totalBets ?? '0'}</p>
            </div>
             <div className="flex flex-col gap-2 rounded-xl p-4 bg-component-dark/40 border border-border">
                <p className="text-text-dark text-sm font-medium leading-normal">Trust Score</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">{stats?.trustScore ?? '0'}</p>
            </div>
        </div>

         { error && (
          <div className="px-4">
             <Alert variant="destructive" className="bg-card">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Fetch Error</AlertTitle>
                <AlertDescription>
                    {error}
                     <Button onClick={fetchUserStats} className="mt-4 w-full">
                        <RefreshCw className="w-4 h-4 mr-2"/>
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
          </div>
        )}
        
         <div className="space-y-4">
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4">Achievements</h3>
             <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
                >
                <CarouselContent className="pl-2">
                    {achievements.map((ach, index) => (
                    <CarouselItem key={index} className="pl-2 md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Card className="overflow-hidden group">
                                <CardContent className="relative flex aspect-video items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url(${ach.image})`}}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
                                    <div className="relative z-20 flex flex-col items-center text-center text-white">
                                         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50">
                                            <DynamicIcon name={ach.icon} className="w-8 h-8 text-primary" />
                                        </div>
                                        <h4 className="text-base font-medium">{ach.name}</h4>
                                        <p className="text-muted-foreground text-sm font-normal mt-1">{ach.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
            </Carousel>
        </div>

        <div className="flex flex-col pt-6 pb-24">
            <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-4">Global Leaderboard</h2>
            <Leaderboard />
        </div>
    </div>
  );
}
