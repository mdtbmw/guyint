
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminLog, Event } from "@/lib/types";
import {
  FilePlus,
  Ban,
  ClipboardCheck,
} from 'lucide-react';
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useAdmin } from "@/hooks/use-admin";

const getActionIcon = (action: AdminLog['action']) => {
  switch(action) {
    case "Created Event": return <FilePlus className="w-3.5 h-3.5" />;
    case "Canceled Event": return <Ban className="w-3.5 h-3.5" />;
    case "Declared Outcome": return <ClipboardCheck className="w-3.5 h-3.5" />;
    default: return null;
  }
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const firestore = useFirestore();

  const eventsQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'events'), orderBy('endDate', 'desc'));
  }, [firestore, isAdmin]);

  const { data: events, loading: eventsLoading } = useCollection<Event>(eventsQuery);

  useEffect(() => {
    if (events) {
        const generatedLogs: AdminLog[] = events.map(event => {
            let action: AdminLog['action'] = "Created Event";
            if (event.status === 'canceled') {
                action = "Canceled Event";
            } else if (event.status === 'finished') {
                action = "Declared Outcome";
            }

            return {
                id: event.id,
                // In a real app, the admin address would be stored with the event
                admin: process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '0xAdmin...aaaa',
                role: 'Event Creator', // Role would be dynamically determined
                action: action,
                timestamp: new Date(event.endDate as Date),
                eventId: event.id,
            };
        });
        
        const sortedLogs = generatedLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
        setLogs(sortedLogs);
    }
  }, [events]);

  const loading = adminLoading || eventsLoading;

  return (
       <Card>
        <CardHeader>
          <CardTitle>Admin Audit Log</CardTitle>
          <CardDescription>An on-chain record of all administrative actions on the mainnet.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        </TableRow>
                    ))
                ) : logs.length > 0 ? (
                    logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{log.admin}</TableCell>
                        <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                            {getActionIcon(log.action)}
                            {log.action}
                        </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-xs break-words">
                         Event ID: {log.eventId}
                        </TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No administrative actions recorded yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
  );
}
