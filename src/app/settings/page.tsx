
'use client';

import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings-form";
import { ParticleBackground } from "@/components/ui/particle-background";

export default function SettingsPage() {
  return (
    <>
      <ParticleBackground />
      <div className="relative z-10 space-y-8">
          <PageHeader
            title="Identity Protocol"
            description="Define how the protocol perceives your signal."
          />
        <SettingsForm />
      </div>
    </>
  );
}
