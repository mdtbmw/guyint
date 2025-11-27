'use client';

import { PageHeader } from "@/components/layout/page-header";
import { BettingHistory } from "@/components/profile/betting-history";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Skeleton } from "@/components/ui/skeleton";


export default function MyLedgerPage() {
  const { isLoading } = useAuthGuard();

  if (isLoading) {
    return (
        <div className="space-y-8 animate-slide-up">
            <PageHeader 
              title="My Ledger"
              description="Track your active signals and review your historical performance."
            />
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-up">
        <PageHeader 
          title="My Ledger"
          description="Track your active signals and review your historical performance."
        />
        
        <BettingHistory />
    </div>
  );
}