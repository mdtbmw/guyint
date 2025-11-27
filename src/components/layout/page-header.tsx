
'use client';

import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="border-b border-border-custom pb-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4 items-center">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                    {title}
                </h1>
                <p className="text-muted-foreground max-w-2xl md:text-right">
                    {description}
                </p>
            </div>
        </div>
    )
}
