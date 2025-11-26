'use client';

import { Activity } from 'lucide-react';


export function PnlChart() {
  return (
    <div className="glass-panel rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden h-full flex flex-col items-center justify-center text-center">
        <Activity className="w-10 h-10 text-emerald-500 mb-4" />
        <h3 className="font-display text-xl font-bold text-white">Performance Engine</h3>
        <p className="text-zinc-400 text-sm mt-2">Historical PnL and detailed analytics are coming soon.</p>
    </div>
  )
}
