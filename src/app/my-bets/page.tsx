'use client';

import { PageHeader } from "@/components/layout/page-header";
import { BettingHistory } from "@/components/profile/betting-history";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function MyBetsPage() {
    // This hook will redirect to the home page if the user is not connected.
    const { isLoading } = useAuthGuard();

    if (isLoading) {
        return <div className="text-center py-12">Loading your betting history...</div>;
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="My Betting History"
                description="An immutable record of your on-chain predictions."
            />
            <BettingHistory />
        </div>
    );
}
