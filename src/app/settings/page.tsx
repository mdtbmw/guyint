
'use client';

import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings-form";
import { ParticleBackground } from "@/components/ui/particle-background";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function SettingsPage() {
  useAuthGuard();
  
  return (
    <>
      <ParticleBackground />
      <div className="relative z-10 space-y-8">
          <PageHeader
            title="Identity"
            description="Define how the protocol perceives your signal."
          />
        <SettingsForm />
      </div>
    </>
  );
}
