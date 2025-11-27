
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Event } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/services/blockchain';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakePanel } from '@/components/stake-panel';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';


export default function EventDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  const { address, walletClient, balance } = useWallet();

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setEventLoading(true);
    try {
      const fetchedEvent = await blockchainService.getEventById(id as string);
      if (!fetchedEvent) {
          toast({
              variant: "destructive",
              title: "Event not found",
              description: "The requested event could not be found or has been removed."
          });
          router.push('/');
          return;
      }
      setEvent(fetchedEvent);
    } catch (e) {
      console.error("Failed to fetch event", e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load event details.",
      });
    } finally {
      setEventLoading(false);
    }
  }, [id, toast, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  if (eventLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col space-y-4">
                 <Skeleton className="aspect-video w-full rounded-lg" />
                 <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    // This state is briefly hit before the redirect in fetchEvent happens.
    return <div className="text-center py-12">Loading event...</div>;
  }
  
  const yesOdds = event.totalPool > 0 && event.outcomes.yes > 0 ? (event.totalPool / event.outcomes.yes) : 1;
  const noOdds = event.totalPool > 0 && event.outcomes.no > 0 ? (event.totalPool / event.outcomes.no) : 1;
  const yesWinPercentage = event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;

  return (
    <div className="flex flex-col min-h-screen -m-4 sm:-m-6 md:m-0">
      <MobilePageHeader title={event.question} />

      <div className="p-4 @container flex-grow">
          <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start bg-component-dark/50 border border-border-custom">
            <div
              className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-xl @xl:min-w-96 @xl:rounded-l-xl @xl:rounded-tr-none"
              style={{backgroundImage: `url("https://picsum.photos/seed/${event.id}/800/400")`}}
              data-ai-hint={event.category.toLowerCase()}
            />
            <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 p-4 @xl:px-4">
              <p className="text-muted-foreground text-sm font-normal leading-normal">{event.category} - Ends {format(new Date(event.endDate), "PP")}</p>
              <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">{event.question}</p>
              <div className="flex items-end gap-3 justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-base font-normal leading-normal">Odds: <span className="text-accent-blue font-bold">{yesOdds.toFixed(2)}</span> vs <span className="text-muted-foreground/80">{noOdds.toFixed(2)}</span></p>
                  <p className="text-muted-foreground text-base font-normal leading-normal">Pool: {event.totalPool.toFixed(2)} $TRUST</p>
                </div>
              </div>
            </div>
          </div>

        <Tabs defaultValue="stats" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 border-b border-border-custom rounded-none">
              <TabsTrigger value="stats" className="border-b-[3px] data-[state=active]:border-b-primary data-[state=active]:text-white text-muted-foreground rounded-none">Stats</TabsTrigger>
              <TabsTrigger value="description" className="border-b-[3px] data-[state=active]:border-b-primary data-[state=active]:text-white text-muted-foreground rounded-none">Description</TabsTrigger>
              <TabsTrigger value="rules" className="border-b-[3px] data-[state=active]:border-b-primary data-[state=active]:text-white text-muted-foreground rounded-none">Rules</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-border-custom">
                        <p className="text-white text-base font-medium leading-normal">YES Win %</p>
                        <p className="text-white tracking-light text-2xl font-bold leading-tight">{yesWinPercentage.toFixed(0)}%</p>
                    </div>
                    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-border-custom">
                        <p className="text-white text-base font-medium leading-normal">NO Win %</p>
                        <p className="text-white tracking-light text-2xl font-bold leading-tight">{(100-yesWinPercentage).toFixed(0)}%</p>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="description" className="mt-4">
              <p className="text-muted-foreground text-base font-normal leading-normal">{event.question}</p>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
               <p className="text-muted-foreground text-sm font-normal leading-normal">All bets are final. Outcomes are determined by a decentralized oracle. In case of ambiguity or cancellation, all stakes will be refunded. A 3% fee is taken from winnings. Your final payout may differ from the estimate at the time of your bet based on pool dynamics.</p>
            </TabsContent>
        </Tabs>
      </div>

      <div className="flex-grow"></div>

      <StakePanel 
        event={event} 
        userBalance={balance} 
        onBetPlaced={fetchEvent} 
        yesOdds={yesOdds} 
        noOdds={noOdds} 
      />

    </div>
  );
}
