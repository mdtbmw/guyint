
'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';

import { UserStats } from '@/lib/types';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getRank } from '@/lib/ranks';

interface UserIDCardProps {
    user: { name: string; address: string | undefined };
    stats: UserStats | null;
}

export function UserIDCard({ user, stats }: UserIDCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // 3D Tilt Effect
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20; 
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        };
        
        if (window.matchMedia("(min-width: 1024px)").matches) {
            card.addEventListener('mousemove', handleMouseMove);
            card.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (card) {
                card.removeEventListener('mousemove', handleMouseMove);
                card.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []);

    const trustScore = stats?.trustScore ?? 0;
    const userRank = useMemo(() => getRank(trustScore), [trustScore]);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/achievements` : '';
    
    const generateImage = useCallback(async (output: 'download' | 'share') => {
        if (!cardRef.current) return;
        
        const buttons = cardRef.current.querySelector('.card-actions');
        if (buttons) (buttons as HTMLElement).style.display = 'none';
        
        try {
            if (output === 'download') {
                const dataUrl = await toPng(cardRef.current, { cacheBust: true });
                const link = document.createElement('a');
                link.download = 'Intuition_ID.png';
                link.href = dataUrl;
                link.click();
            } else if (output === 'share' && navigator.share) {
                const blob = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
                const file = new File([blob], 'Intuition_ID.png', { type: 'image/png' });
                const shareData = {
                    title: 'My Intuition ID',
                    text: `Check out my stats on Intuition BETs! My Trust Score is ${trustScore.toFixed(1)}.`,
                    files: [file]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                     toast({ title: "Share Not Supported", description: "Your browser cannot share this type of file." });
                }
            } else {
                 toast({ title: "Share Not Supported", description: "Your browser does not support the Web Share API." });
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') { // Don't show error if user cancels share dialog
                console.error(err);
                toast({
                  variant: 'destructive',
                  title: "Image Generation or Share Failed",
                  description: "Could not generate or share the ID card image.",
                });
            }
        } finally {
             if (buttons) (buttons as HTMLElement).style.display = 'flex';
        }

    }, [trustScore, toast]);


    return (
        <div className="w-full xl:w-2/5 card-3d-wrap">
            <div ref={cardRef} id="id-card" className="card-3d relative w-full aspect-[1.586] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 group">
                <div className="absolute inset-0 bg-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-100"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold-500/20 to-transparent rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-obsidian to-transparent rounded-tr-full"></div>
                <div className="absolute inset-0 bg-holographic bg-[length:200%_200%] opacity-30 group-hover:opacity-50 transition-opacity mix-blend-overlay animate-shimmer"></div>
                
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full border border-white/10 rounded-[2rem]">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-white text-black flex items-center justify-center font-display font-bold text-xl rounded-xl shadow-lg p-1.5">
                                <Logo/>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Intuition ID</p>
                                <p className="text-xs font-mono text-gold-500">INT-{(user.address || "0000").slice(2, 6).toUpperCase()}-X</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 rounded-full border border-primary/50 bg-primary/10 backdrop-blur-md">
                            <span className="text-[10px] font-bold uppercase text-primary tracking-widest">{userRank.name} Tier</span>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left mt-4 md:mt-0">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight drop-shadow-lg">{user.name}</h1>
                        <p className="text-zinc-500 text-xs mt-1 font-mono">Member since Block #18,040</p>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Trust Score</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600">{trustScore.toFixed(1)}</span>
                                <span className="text-sm text-zinc-500 font-bold">/ 150</span>
                            </div>
                        </div>
                        <div className="h-14 w-14 rounded-xl border-2 border-white/20 flex items-center justify-center p-1 bg-white/10">
                            <QRCode
                                value={profileUrl}
                                size={48}
                                bgColor="transparent"
                                fgColor="white"
                                level="L"
                            />
                        </div>
                    </div>
                </div>
                 {/* Action buttons - hidden from image capture */}
                <div className="card-actions absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="icon" variant="secondary" onClick={() => generateImage('share')} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => generateImage('download')} className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
