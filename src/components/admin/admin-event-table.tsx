
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { DeclareOutcomeDialog, CancelEventDialog } from "./admin-action-dialogs";
import { cn } from "@/lib/utils";

const getStatusBadge = (status: Event['status']) => {
  switch (status) {
    case "open":
      return <Badge className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-blue-500/30">Open</Badge>;
    case "closed":
      return <Badge variant="secondary">Closed</Badge>;
    case "finished":
      return <Badge className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">Finished</Badge>;
    case "canceled":
      return <Badge variant="destructive" className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function AdminEventTable({ events, loading }: { events: Event[] | null, loading: boolean }) {
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
            <TableHead>Total Pool</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))
          ) : events && events.length > 0 ? (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium max-w-sm truncate">{event.question}</TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>${event.totalPool.toFixed(2)}</TableCell>
                <TableCell>{event.participants}</TableCell>
                <TableCell>{format(new Date(event.endDate as Date), "PPp")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                       <DropdownMenuItem disabled>
                         <Edit className="mr-2 h-4 w-4" />
                         Edit Event
                       </DropdownMenuItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeclare(event)}
                        disabled={event.status !== 'closed'}
                        className={cn(event.status === 'closed' && 'text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300')}
                      >
                         <CheckCircle className="mr-2 h-4 w-4" />
                        Declare Outcome
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancel(event)}
                        disabled={event.status !== 'open'}
                        className={cn(event.status === 'open' && 'text-rose-400 focus:bg-rose-500/10 focus:text-rose-300')}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
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
            />
            <CancelEventDialog
                isOpen={isCancelOpen}
                setIsOpen={setCancelOpen}
                event={selectedEvent}
            />
        </>
      )}
    </>
  );
}
