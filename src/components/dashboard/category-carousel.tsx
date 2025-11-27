
'use client';

import React, { useMemo } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import placeholderData from '@/lib/placeholder-images.json';
import { DynamicIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface CategoryCarouselProps {
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
}

export function CategoryCarousel({ categoryFilter, setCategoryFilter }: CategoryCarouselProps) {
    const categories = useMemo(() => placeholderData.categories, []);
    
    // We duplicate the items to create a seamless looping effect visually
    const loopedCategories = useMemo(() => [...categories, ...categories], [categories]);

    return (
        <div className="relative">
            <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
            <Carousel
                opts={{
                    align: 'start',
                    loop: true,
                    dragFree: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 2000,
                        stopOnInteraction: true,
                        stopOnMouseEnter: true,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className="-ml-3">
                    <CarouselItem className="pl-3 basis-auto">
                        <button onClick={() => setCategoryFilter('All')} className={cn(
                            'snap-card flex-none w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 active-press transition-all',
                            categoryFilter === 'All' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-primary/80' : 'bg-card border border-border text-muted-foreground hover:bg-accent'
                        )}>
                            <DynamicIcon name="Flame" className="w-6 h-6" strokeWidth="1.5" />
                            <span className="text-xs font-bold">All</span>
                        </button>
                    </CarouselItem>

                    {loopedCategories.map((cat, index) => (
                        <CarouselItem key={`${cat.id}-${index}`} className="pl-3 basis-auto">
                            <button onClick={() => setCategoryFilter(cat.name)} className={cn(
                                'snap-card flex-none w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 group active-press transition-all',
                                categoryFilter === cat.name ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-primary/80' : 'bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border'
                            )}>
                                <DynamicIcon name={cat.icon} className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth="1.5" />
                                <span className="text-xs font-medium">{cat.name}</span>
                            </button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
