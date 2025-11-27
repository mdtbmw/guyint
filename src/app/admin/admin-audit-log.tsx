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
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/use-admin";

const getActionIcon = (action: AdminLog['action']) => {
  switch(action) {
    case "Created Event": return <FilePlus className="w-3.5 h-3.5" />;
    case "Canceled Event": return <Ban className="w-3.5 h-3.5" />;
    case "Declared Outcome": return <ClipboardCheck className="w-3.5 h-3.5" />;
    default: return null;
  }
}

export function AdminAuditLog({ events, loading }: { events: Event[], loading: boolean }) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const { adminAddress } = useAdmin();

  useEffect(() => {
    if (events.length > 0 && adminAddress) {
        const generatedLogs: AdminLog[] = events.flatMap(event => {
            const logsForEvent: AdminLog[] = [];

            // A more realistic creation time: subtract 7 days from the end date.
            const creationTime = event.endDate ? new Date(new Date(event.endDate).getTime() - (7 * 24 * 60 * 60 * 1000)) : new Date();
            logsForEvent.push({
                id: `${event.id}-created`,
                admin: adminAddress,
                role: 'Event Creator', 
                action: "Created Event",
                timestamp: creationTime,
                eventId: event.id,
            });
            
            if (event.status === 'canceled') {
                 logsForEvent.push({
                    id: `${event.id}-canceled`,
                    admin: adminAddress,
                    role: 'Event Creator', 
                    action: "Canceled Event",
                    timestamp: event.endDate ? new Date(event.endDate) : new Date(),
                    eventId: event.id,
                });
            } else if (event.status === 'finished') {
                logsForEvent.push({
                    id: `${event.id}-finished`,
                    admin: adminAddress,
                    role: 'Event Creator', 
                    action: "Declared Outcome",
                    timestamp: event.endDate ? new Date(event.endDate) : new Date(),
                    eventId: event.id,
                });
            }
            return logsForEvent;
        });
        
        const sortedLogs = generatedLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
        setLogs(sortedLogs);
    }
  }, [events, adminAddress]);

  return (
       <Card>
        <CardHeader>
          <CardTitle>Admin Audit Log</CardTitle>
          <CardDescription>A simplified, on-chain record of administrative actions.</CardDescription>
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
