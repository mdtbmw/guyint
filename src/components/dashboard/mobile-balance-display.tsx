
'use client';

import { DynamicIcon } from '@/lib/icons';

interface MobileBalanceDisplayProps {
    balance: number;
    currencySymbol: string;
}

export function MobileBalanceDisplay({ balance, currencySymbol }: MobileBalanceDisplayProps) {
    return (
        <div className="bg-background/30 border border-border rounded-3xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Trustnet Balance</p>
                <p className="text-2xl font-display font-bold text-foreground">
                    {balance.toFixed(4)} <span className="text-primary text-lg">{currencySymbol}</span>
                </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <DynamicIcon name="ShieldCheck" className="w-6 h-6" strokeWidth="1.5" />
            </div>
        </div>
    )
}
