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
import { CheckCircle, Lock, Ban } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { DeclareOutcomeDialog, CancelEventDialog } from "./admin-action-dialogs";

const getStatusBadge = (status: Event['status']) => {
  switch (status) {
    case "open":
      return <Badge className="bg-success/20 text-success border-success/30 gap-1"><div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>Live</Badge>;
    case "closed":
      return <Badge className="bg-warning/20 text-warning border-warning/30 gap-1"><Lock className="w-3 h-3"/>Locked</Badge>;
    case "finished":
      return <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30 gap-1"><CheckCircle className="w-3 h-3"/>Resolved</Badge>;
    case "canceled":
      return <Badge variant="destructive" className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30 gap-1"><Ban className="w-3 h-3"/>Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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

    const handleDeclare = (event: Event) => {
        setSelectedEvent(event);
        setDeclareOpen(true);
    };

    const handleCancel = (event: Event) => {
        setSelectedEvent(event);
        setCancelOpen(true);
    };


  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : events && events.length > 0 ? (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium max-w-sm truncate">{event.question}</TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>${event.totalPool.toFixed(2)}</TableCell>
                <TableCell>{format(new Date(event.endDate as Date), "PPp")}</TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        className="bg-primary/80 text-background-dark font-bold hover:bg-primary"
                        onClick={() => handleDeclare(event)}
                        disabled={event.status !== 'closed'}
                        >
                         Declare Result
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="bg-error/80 text-white font-bold hover:bg-error"
                        onClick={() => handleCancel(event)}
                        disabled={event.status !== 'open'}
                        >
                         Cancel Event
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
      {selectedEvent && (
        <>
            <DeclareOutcomeDialog
                isOpen={isDeclareOpen}
                setIsOpen={setDeclareOpen}
                event={selectedEvent}
                onActionSuccess={onActionSuccess}
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
