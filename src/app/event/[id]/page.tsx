

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Event } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { StakePanel } from '@/components/stake-panel';
import Image from 'next/image';
import { useNotifications } from '@/lib/state/notifications';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Scale, Users, Lock, Timer } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import placeholderData from '@/lib/placeholder-images.json';
import { useCountdown } from '@/hooks/use-countdown';


const EventDetailSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-48 w-full md:h-64 rounded-lg" />
        <div className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-3 pt-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    </div>
);

const CountdownDisplay = ({ time, label }: { time: number, label: string }) => (
    <div className="flex flex-col items-center">
        <p className="text-4xl font-bold tracking-tighter text-primary">{String(time).padStart(2, '0')}</p>
        <p className="text-xs font-mono uppercase text-muted-foreground">{label}</p>
    </div>
)


export default function EventDetailPage() {
  const { id } = useParams();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { balance, chain } = useWallet();
  const { timeLeft, hasEnded: countdownEnded } = useCountdown(event?.bettingStopDate || null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setEventLoading(true);
    try {
      blockchainService.clearCache();
      const fetchedEvent = await blockchainService.getEventById(id as string);
      if (!fetchedEvent) {
          addNotification({
              variant: "destructive",
              title: "Event not found",
              description: "The requested event could not be found or has been removed.",
              icon: 'AlertTriangle',
              type: 'general'
          });
          router.push('/');
          return;
      }
      setEvent(fetchedEvent);
    } catch (e: any) {
      addNotification({
        variant: "destructive",
        title: "Error Loading Event",
        description: e.shortMessage || "Could not load event details from the blockchain.",
        icon: 'AlertTriangle',
        type: 'general'
      });
    } finally {
      setEventLoading(false);
    }
  }, [id, addNotification, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  
  const handleBetPlaced = () => {
    fetchEvent();
    setIsSheetOpen(false); // Close sheet after placing bet
  }


  if (eventLoading || !event) {
    return <EventDetailSkeleton />;
  }
  
  const yesOdds = event.totalPool > 0 && event.outcomes.yes > 0 ? (event.totalPool / event.outcomes.yes) : 1;
  const noOdds = event.totalPool > 0 && event.outcomes.no > 0 ? (event.totalPool / event.outcomes.no) : 1;
  const yesPoolPercentage = event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;

  const bettingHasEnded = countdownEnded || (event.bettingStopDate ? new Date(event.bettingStopDate) < new Date() : event.status !== 'open');
  
  const timeLabel = (() => {
    if (bettingHasEnded && event.status !== 'finished' && event.status !== 'canceled') {
        return "Betting Locked. Awaiting outcome.";
    }
    if (event.resolutionDate) {
      return `Resolved on ${format(new Date(event.resolutionDate), 'PP')}`;
    }
    if (event.bettingStopDate) {
        return `Ended on ${format(new Date(event.bettingStopDate), 'PP')}`;
    }
    return 'Event concluded.';
  })();

  const categoryImage = placeholderData.categories.find(c => c.name === event.category)?.image;
  const imageUrl = event.imageUrl || categoryImage || `https://picsum.photos/seed/${event.id}/1200/675`;

  return (
    <div className="space-y-8">
    <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
        {/* Left side: Scrollable Event Info */}
        <div className="pb-24 md:pb-6">
             <div className="relative aspect-video w-full mb-6">
                 <Image
                    src={imageUrl}
                    alt={event.question}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={event.category.toLowerCase()}
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent rounded-lg" />
            </div>

            <PageHeader
                title={event.question}
                description={`${event.category}`}
            />
            
            <div className="space-y-6">
                
                { event.status === 'open' && !bettingHasEnded && timeLeft ? (
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Timer className="w-4 h-4 text-primary" />
                                Betting Closes In
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-around">
                            <CountdownDisplay time={timeLeft.days} label="Days" />
                            <CountdownDisplay time={timeLeft.hours} label="Hours" />
                            <CountdownDisplay time={timeLeft.minutes} label="Minutes" />
                            <CountdownDisplay time={timeLeft.seconds} label="Seconds" />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-4 text-center text-muted-foreground font-medium">
                            {timeLabel}
                        </CardContent>
                    </Card>
                )}


                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium text-muted-foreground">Total Pool</CardTitle>
                           <Layers className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{event.totalPool.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{chain?.nativeCurrency.symbol}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium text-muted-foreground">YES Odds</CardTitle>
                           <Scale className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{yesOdds.toFixed(2)}x</p>
                             <p className="text-xs text-muted-foreground">Payout multiplier</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium text-muted-foreground">NO Odds</CardTitle>
                           <Scale className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                           <p className="text-2xl font-bold">{noOdds.toFixed(2)}x</p>
                           <p className="text-xs text-muted-foreground">Payout multiplier</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Pool Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full h-8 rounded-lg bg-secondary overflow-hidden flex items-center justify-between text-background font-bold text-sm px-3">
                            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 z-0" style={{ width: `${yesPoolPercentage}%`}}></div>
                            <span className="z-10">YES {yesPoolPercentage.toFixed(0)}%</span>
                            <span className="z-10">NO {(100 - yesPoolPercentage).toFixed(0)}%</span>
                        </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rules & Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">{event.description || 'All bets are final. Outcomes are determined by a decentralized oracle. In case of ambiguity or cancellation, all stakes will be refunded.'}</p>
                    </CardContent>
                 </Card>
            </div>
        </div>

        {/* Right side: Stake Panel (fixed on desktop) */}
        <div className="hidden md:sticky md:top-24 md:h-fit md:flex md:items-start">
            <div className="w-full md:max-w-md mx-auto">
                 <StakePanel 
                    event={event} 
                    userBalance={balance} 
                    onBetPlaced={handleBetPlaced} 
                    yesOdds={yesOdds} 
                    noOdds={noOdds} 
                />
            </div>
        </div>
    </div>
    
    {/* Bottom Sheet and FAB for Mobile */}
    <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm border-t border-border z-40">
                     <Button className="w-full h-14 text-base font-bold rounded-2xl active-press" disabled={bettingHasEnded}>
                        {bettingHasEnded ? <><Lock className="w-4 h-4 mr-2"/>Betting Closed</> : 'Place Bet'}
                    </Button>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 h-auto rounded-t-2xl border-t-0 bg-secondary shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                 <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-center">{event.question}</SheetTitle>
                </SheetHeader>
                <StakePanel 
                    event={event} 
                    userBalance={balance} 
                    onBetPlaced={handleBetPlaced} 
                    yesOdds={yesOdds} 
                    noOdds={noOdds} 
                />
            </SheetContent>
        </Sheet>
    </div>
    </div>
  );
}
