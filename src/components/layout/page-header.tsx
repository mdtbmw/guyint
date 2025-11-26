
'use client';

import React, { useEffect } from "react";
import { useHeaderState } from "@/lib/state/header";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    const { setHeaderState } = useHeaderState();
    const isMobile = useIsMobile();

    useEffect(() => {
        // Update the global header state when the component mounts or props change
        setHeaderState({ title, subtitle: description });

        // Cleanup function to reset the header state when the component unmounts
        return () => {
            setHeaderState({ title: '', subtitle: '' });
        };
    }, [title, description, setHeaderState]);

    // On mobile, we don't render this component directly because its content
    // is now displayed in the main AppHeader.
    if (isMobile) {
        return <div className="h-6" />;
    }

    return (
        <div className="pb-0 mb-0">
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
    );
}

    