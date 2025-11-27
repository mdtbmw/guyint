
'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
    showBackButton?: boolean;
}

export function PageHeader({ title, description, showBackButton = false }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="pb-6 mb-6">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
                        {title}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}
