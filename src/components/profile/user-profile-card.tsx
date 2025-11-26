
'use client';

import { useState, useRef, useCallback } from 'react';
import { useSettings } from "@/lib/state/settings";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import QRCode from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Download, Twitter, Globe, Share2, Camera } from 'lucide-react';
import { AvatarSelectionDialog } from './avatar-selection-dialog';

export function UserProfileCard() {
    const { settings } = useSettings();
    const { address } = useWallet();
    const qrCardRef = useRef<HTMLDivElement>(null);
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

    const username = settings.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Anonymous");

    const handleDownload = useCallback(() => {
        if (qrCardRef.current === null) {
            return;
        }

        toPng(qrCardRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `${username}-intuition-id.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('Failed to generate ID card image', err);
            });
    }, [qrCardRef, username]);

    return (
        <>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
                    <div className="relative w-32 h-32 shrink-0">
                         <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-br from-primary to-background">
                            <img 
                                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${settings.username || address}`} 
                                alt="Selected Avatar" 
                                className="rounded-full bg-background w-full h-full object-cover border-4 border-background"
                            />
                        </div>
                        <Button 
                            size="icon" 
                            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-4 border-background shadow-md"
                            onClick={() => setIsAvatarDialogOpen(true)}
                        >
                            <Camera className="w-4 h-4"/>
                        </Button>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-bold text-foreground">{username}</h2>
                        <p className="text-sm font-mono text-primary mt-1">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</p>
                        
                        <p className="text-sm text-muted-foreground mt-4 h-16">{settings.bio || "No manifesto set. This is your chance to state your mission."}</p>

                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                            {settings.twitter && (
                                 <a href={`https://twitter.com/${settings.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                    <Twitter className="w-3.5 h-3.5"/>
                                    {settings.twitter}
                                </a>
                            )}
                             {settings.website && (
                                <a href={settings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                    <Globe className="w-3.5 h-3.5"/>
                                    {settings.website.replace(/https?:\/\//, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative bg-card/60 backdrop-blur-xl border border-border rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 text-center">
                     <div ref={qrCardRef} className="bg-background p-4 rounded-2xl">
                        <QRCode
                            value={address || ''}
                            size={128}
                            bgColor="hsl(var(--background))"
                            fgColor="hsl(var(--foreground))"
                            level="H"
                            includeMargin={false}
                        />
                     </div>
                    <p className="text-xs text-muted-foreground max-w-xs">Share your address to receive $TRUST or other assets on the Intuition chain.</p>
                    <Button onClick={handleDownload} variant="secondary" className="w-full">
                        <Download className="w-4 h-4 mr-2"/>
                        Download ID
                    </Button>
                </div>
            </div>
            <AvatarSelectionDialog isOpen={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen} />
        </>
    )
}
