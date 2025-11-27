'use client';

import { PageHeader } from "@/components/layout/page-header";
import { Leaderboard } from "@/components/leaderboard";
import { UserProfileStats } from "@/components/profile/user-profile-stats";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Skeleton } from "@/components/ui/skeleton";


export default function ProfilePage() {
  const { isLoading } = useAuthGuard();

  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader 
              title="My Profile"
              description="Your on-chain identity and prediction history."
              showBackButton
            />
             <div className="p-4">
                <div className="flex gap-4 items-center h-32">
                    <Skeleton className="w-32 h-32 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4 p-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <PageHeader 
          title="My Profile"
          description="Your on-chain identity and prediction history."
          showBackButton
        />
        
        <UserProfileStats />
        
        <div className="flex flex-col pt-6 pb-24">
            <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] px-4 pb-4">Global Leaderboard</h2>
            <Leaderboard />
        </div>
    </div>
  );
}
