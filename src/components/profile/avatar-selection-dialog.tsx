
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/lib/state/settings';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const avatarSeeds = [
    'Daniel', 'Gizmo', 'Leo', 'Willow', 'Oliver', 'Lucy', 'Max', 'Zoe', 'Milo',
    'Cleo', 'Rocky', 'Chloe', 'Toby', 'Sophie', 'Cody', 'Lily', 'Buster', 'Mia', 'Duke',
    'Luna', 'Bear', 'Sadie', 'Murphy', 'Lola', 'Winston', 'Ruby', 'Zeus', 'Stella',
    'Apollo', 'Penny', 'Loki', 'Rosie', 'Thor', 'Coco', 'Odin', 'Daisy', 'Axel', 'Gracie',
    'Hercules', 'Phoebe', 'Finn', 'Nala', 'Gus', 'Izzy', 'Koda', 'Hazel', 'Bruno', 'Piper'
];

interface AvatarSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvatarSelectionDialog({ isOpen, onOpenChange }: AvatarSelectionDialogProps) {
    const { settings, setSettings } = useSettings();
    const { toast } = useToast();
    const [selectedSeed, setSelectedSeed] = useState(settings.username || 'Daniel');

    const handleSave = () => {
        setSettings(prev => ({ ...prev, username: selectedSeed }));
        onOpenChange(false);
        toast({
            title: "Avatar Updated",
            description: "Your new identity signal has been set.",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border-border rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Select Your Avatar</DialogTitle>
                    <DialogDescription>
                        Choose an avatar that represents your signal. This also sets your default username.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col sm:flex-row gap-6 items-center py-4">
                    <div className="relative w-28 h-28 shrink-0">
                         <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-primary to-zinc-800">
                            <img 
                                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${selectedSeed}`} 
                                alt="Selected Avatar" 
                                className="rounded-full bg-background w-full h-full object-cover border-2 border-background"
                            />
                        </div>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-muted-foreground">PREVIEW</p>
                        <p className="text-2xl font-bold font-display text-foreground">{selectedSeed}</p>
                    </div>
                </div>

                <ScrollArea className="h-64 border rounded-lg p-2">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {avatarSeeds.map(seed => (
                            <button
                                key={seed}
                                onClick={() => setSelectedSeed(seed)}
                                className={cn(
                                    "relative rounded-md p-1 active-press transition-all",
                                    selectedSeed === seed ? 'ring-2 ring-primary' : 'hover:bg-accent'
                                )}
                            >
                                <img 
                                    src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}`}
                                    alt={seed}
                                    className="w-full h-full object-cover rounded-sm bg-secondary"
                                />
                                {selectedSeed === seed && (
                                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSave}>
                        Confirm Identity <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

