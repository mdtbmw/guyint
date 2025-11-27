
'use client';

import React from "react";

interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {title}
            </h1>
            <p className="text-muted-foreground mt-1">
                {description}
            </p>
        </div>
    )
}
