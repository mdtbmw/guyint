
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, Ban, CircleDotDashed, Trash2, Edit, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { DeclareOutcomeDialog, CancelEventDialog } from "./admin-action-dialogs";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const getStatusBadge = (status: Event['status']) => {
  switch (status) {
    case "open":
      return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5"><CircleDotDashed className="w-3 h-3 animate-pulse"/>Live</Badge>;
    case "closed":
      return <Badge variant="secondary" className="gap-1.5"><Lock className="w-3 h-3"/>Locked</Badge>;
    case "finished":
      return <Badge variant="secondary" className="opacity-70 gap-1.5"><CheckCircle className="w-3 h-3"/>Resolved</Badge>;
    case "canceled":
      return <Badge variant="destructive" className="gap-1.5"><Ban className="w-3 h-3"/>Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const EventCard = ({ event, onDeclare, onCancel }: { event: Event; onDeclare: (e: Event) => void; onCancel: (e: Event) => void; }) => {
    const router = useRouter();
    const { chain } = useWallet();

    return (
        <Card className="glass-panel" onClick={() => router.push(`/event/${event.id}`)}>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-foreground pr-4">{event.question}</p>
                    {getStatusBadge(event.status)}
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Pool</p>
                    <p className="font-bold text-foreground">{event.totalPool.toFixed(4)} {chain?.nativeCurrency.symbol}</p>
                </div>
                 <div className="text-right">
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Betting Locks</p>
                    <p className="font-bold text-foreground">{event.bettingStopDate ? format(new Date(event.bettingStopDate), "PP") : 'N/A'}</p>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                 <Button
                    size="sm"
                    variant="secondary"
                    className="w-full active-press"
                    onClick={(e) => { e.stopPropagation(); onDeclare(event); }}
                    disabled={event.status === 'finished' || event.status === 'canceled'}
                    >
                        <Edit className="w-4 h-4 mr-2"/>
                        Declare Result
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                     className="w-full active-press"
                    onClick={(e) => { e.stopPropagation(); onCancel(event); }}
                    disabled={event.status !== 'open'}
                    >
                        <Trash2 className="w-4 h-4 mr-2"/>
                        Refund
                </Button>
            </CardFooter>
        </Card>
    );
};

interface AdminEventTableProps {
  events: Event[] | null;
  loading: boolean;
  onActionSuccess: () => void;
}

export function AdminEventTable({ events, loading, onActionSuccess }: AdminEventTableProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDeclareOpen, setDeclareOpen] = useState(false);
    const [isCancelOpen, setCancelOpen] = useState(false);
    const router = useRouter();
    const { chain, walletClient, address } = useWallet();
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const handleDeclare = (event: Event) => {
        setSelectedEvent(event);
        setDeclareOpen(true);
    };

    const handleCancel = (event: Event) => {
        setSelectedEvent(event);
        setCancelOpen(true);
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };
    
    const visibleEvents = useMemo(() => events?.slice(0, visibleCount) || [], [events, visibleCount]);
    const canLoadMore = events ? visibleCount < events.length : false;


  if (loading) {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
        </div>
    )
  }

  return (
    <>
    {/* Mobile Card View */}
    <div className="grid md:hidden grid-cols-1 gap-4">
        {visibleEvents && visibleEvents.length > 0 ? (
            visibleEvents.map((event) => (
                <EventCard key={event.id} event={event} onDeclare={handleDeclare} onCancel={handleCancel} />
            ))
        ) : (
             <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl">
                No events found.
            </div>
        )}
        {canLoadMore && (
            <Button onClick={handleLoadMore} variant="outline" className="w-full active-press">
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More
            </Button>
        )}
    </div>


    {/* Desktop Table View */}
    <div className="hidden md:block glass-panel rounded-[2rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%]">Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>Betting Locks</TableHead>
            <TableHead className="text-right w-[300px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleEvents && visibleEvents.length > 0 ? (
            visibleEvents.map((event) => (
              <TableRow key={event.id} onClick={() => router.push(`/event/${event.id}`)} className="cursor-pointer group">
                <TableCell className="font-medium max-w-sm truncate text-foreground group-hover:text-primary transition-colors">
                  <div className="flex items-center">
                    <span>{event.question}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>{event.totalPool.toFixed(4)} {chain?.nativeCurrency.symbol}</TableCell>
                <TableCell>{event.bettingStopDate ? format(new Date(event.bettingStopDate), "PPp") : 'N/A'}</TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="active-press"
                        onClick={(e) => { e.stopPropagation(); handleDeclare(event); }}
                        disabled={event.status === 'finished' || event.status === 'canceled'}
                        >
                         Declare Result
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="active-press"
                        onClick={(e) => { e.stopPropagation(); handleCancel(event); }}
                        disabled={event.status !== 'open'}
                        >
                         <Trash2 className="w-4 h-4 mr-2"/>
                         Delete/Refund
                      </Button>
                   </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No events found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
       {canLoadMore && (
        <div className="p-4 border-t">
            <Button onClick={handleLoadMore} variant="outline" className="w-full active-press">
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More
            </Button>
        </div>
        )}
      </div>
      {selectedEvent && (
        <>
            <DeclareOutcomeDialog
                isOpen={isDeclareOpen}
                setIsOpen={setDeclareOpen}
                event={selectedEvent}
                onActionSuccess={onActionSuccess}
                walletClient={walletClient}
                address={address}
            />
            <CancelEventDialog
                isOpen={isCancelOpen}
                setIsOpen={setCancelOpen}
                event={selectedEvent}
                onActionSuccess={onActionSuccess}
            />
        </>
      )}
    </>
  );
}
