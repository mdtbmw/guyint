
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/lib/icons';
import { Logo } from '@/components/ui/logo';

const SpotlightCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    return <div ref={cardRef} className={cn("spotlight-card", className)}>{children}</div>;
};

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={cn("transition-all duration-1000", isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10')} style={{transitionDelay: `${delay}ms`}}>
            {children}
        </div>
    );
};

export function LandingPage() {
    const { open } = useWallet();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNavbarCompact, setIsNavbarCompact] = useState(false);
    const [stats, setStats] = useState({ markets: 1204, volume: 24540102, community: 42891 });

    useEffect(() => {
        const handleScroll = () => setIsNavbarCompact(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                markets: Math.random() > 0.7 ? prev.markets + Math.floor(Math.random() * 3) - 1 : prev.markets,
                volume: Math.random() > 0.7 ? prev.volume + Math.floor(Math.random() * 10000) - 3000 : prev.volume,
                community: Math.random() > 0.7 ? prev.community + Math.floor(Math.random() * 10) - 3 : prev.community,
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="bg-obsidian text-zinc-300 font-sans antialiased overflow-x-hidden relative">
            <div id="navbar-container" className={cn("fixed w-full z-50 transition-all duration-500", isNavbarCompact ? 'top-3 px-2 scale-95' : 'top-6 px-4')}>
                 <nav className="mx-auto max-w-5xl glass-panel rounded-full px-2 py-2 flex items-center justify-between shadow-2xl shadow-black/50 border border-white/10 pl-6">
                    <a href="#hero" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 bg-gold-500 text-black flex items-center justify-center font-display font-bold text-lg rounded-full group-hover:bg-gold-400 transition-all duration-300 shadow-lg shadow-white/10 group-hover:scale-110 p-1.5">
                            <Logo/>
                        </div>
                        <span className="font-display font-bold text-white tracking-tight group-hover:text-gold-400 transition-colors hidden sm:block">Intuition BETs</span>
                    </a>
                    <div className="hidden md:flex items-center gap-1 bg-black/40 rounded-full p-1.5 border border-white/5 backdrop-blur-md">
                        <a href="#hero" className="px-5 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">Home</a>
                        <a href="#worlds" className="px-5 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">Worlds</a>
                        <a href="#technology" className="px-5 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">Engine</a>
                        <a href="#community" className="px-5 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white transition-all">Trust</a>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                        <button onClick={open} className="bg-white hover:bg-gold-400 text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wide transition-all transform hover:scale-105 shadow-lg shadow-white/10 hover:shadow-gold-400/40">Connect</button>
                        <button onClick={toggleMenu} className="md:hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"><DynamicIcon name="Menu" className="w-5 h-5" /></button>
                    </div>
                </nav>
            </div>

            <div id="mobile-menu" className={cn("fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex items-center justify-center transition-transform duration-500", isMenuOpen ? "translate-x-0" : "translate-x-full")}>
                <button onClick={toggleMenu} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"><DynamicIcon name="X" className="w-6 h-6" /></button>
                <div className="flex flex-col gap-6 text-center">
                    <a href="#worlds" onClick={toggleMenu} className="text-3xl font-display font-bold text-white hover:text-gold-400 transition-colors">Worlds</a>
                    <a href="#technology" onClick={toggleMenu} className="text-3xl font-display font-bold text-white hover:text-gold-400 transition-colors">Engine</a>
                    <a href="#community" onClick={toggleMenu} className="text-3xl font-display font-bold text-white hover:text-gold-400 transition-colors">Trust</a>
                </div>
            </div>

            <section id="hero" className="relative pt-48 pb-20 lg:pt-64 lg:pb-32 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl relative z-20">
                        <Reveal>
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-medium mb-8 backdrop-blur-md hover:bg-gold-500/10 transition-colors cursor-default">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                                </span>
                                <span className="font-mono tracking-widest">{stats.markets.toLocaleString()}</span> <span className="text-white/30">|</span> LIVE MARKETS
                            </div>
                        </Reveal>
                        <Reveal delay={100}>
                            <h1 className="font-display text-6xl sm:text-7xl lg:text-9xl font-bold text-white tracking-tighter leading-[0.85] mb-10">
                                SILENCE THE <br />
                                <span className="text-gradient-gold relative inline-block">
                                    NOISE.
                                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-gold-500 opacity-60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7501 2.49994 63.2852 3.2105 104.701 4.93604C141.417 6.46593 173.121 6.93294 197.999 4.49992" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                                </span>
                            </h1>
                        </Reveal>
                         <Reveal delay={200}>
                            <p className="text-lg sm:text-xl text-zinc-400 max-w-lg leading-relaxed mb-12 border-l-2 border-gold-500/30 pl-6 ml-2">
                                This is not a game. It is a live challenge. <br/><br/>
                                <span className="text-white font-medium text-2xl">Can you win?</span>
                            </p>
                        </Reveal>
                        <Reveal delay={300}>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={open} className="group relative px-10 py-5 bg-gold-500 text-black font-bold text-sm tracking-wide uppercase overflow-hidden rounded-full shadow-xl shadow-gold-500/20 hover:shadow-gold-500/40 transition-all transform hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="relative z-10 flex items-center gap-2">Accept the Challenge <DynamicIcon name="ArrowRight" className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                                </button>
                            </div>
                        </Reveal>
                    </div>

                    <div className="hidden lg:block absolute top-0 right-0 w-[800px] h-[800px] pointer-events-none perspective-[1200px]">
                        <SpotlightCard className="absolute top-32 right-20 w-96 glass-panel p-8 rounded-[2rem] transform rotate-y-[-15deg] rotate-z-[-5deg] animate-float z-20 hover:rotate-0 hover:scale-105 transition-all duration-700 pointer-events-auto cursor-pointer border-t border-white/20 group">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-2 items-center px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase text-red-400 tracking-wider">Live</span>
                                </div>
                                <span className="text-gold-400 text-[10px] font-bold border border-gold-500/30 px-3 py-1 rounded-full bg-gold-500/5 group-hover:bg-gold-500 group-hover:text-black transition-colors">FINANCE</span>
                            </div>
                            <h3 className="text-white font-display text-2xl leading-tight mb-6 group-hover:text-gold-400 transition-colors">BTC closes > $100k?</h3>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-gradient-to-r from-gold-600 to-gold-300 w-[72%] shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>
                            </div>
                            <div className="flex justify-between text-xs font-mono text-zinc-400">
                                <span className="text-white">YES <span className="text-gold-400 font-bold">72%</span></span>
                                <span>Pool: <span className="text-white">${(842109).toLocaleString()}</span></span>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="absolute top-80 right-32 w-80 glass-panel p-6 rounded-[2rem] transform rotate-y-[-10deg] rotate-z-[3deg] animate-float-delayed z-10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 pointer-events-auto cursor-pointer border-t border-white/20">
                            <div className="flex justify-between items-center mb-5">
                                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">SPORTS</span>
                                <DynamicIcon name="Crown" className="w-4 h-4 text-zinc-500" />
                            </div>
                            <h3 className="text-zinc-200 font-display text-lg mb-5">Finals: Winner</h3>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/5 py-3 text-center text-xs font-bold text-zinc-300 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">Team A</div>
                                <div className="flex-1 bg-white/5 py-3 text-center text-xs font-bold text-zinc-300 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">Team B</div>
                            </div>
                        </SpotlightCard>
                    </div>
                </div>
            </section>
        </div>
    );
}
