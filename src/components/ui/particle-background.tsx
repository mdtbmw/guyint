'use client';

import React, { useRef, useEffect } from 'react';

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let particles: { x: number; y: number; vx: number; vy: number; }[] = [];
    let animationFrameId: number;

    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        particles = [];
        const particleCount = Math.floor(width * height / 25000); // Adjust density
        for(let i=0; i<particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
            });
        }
    }
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0,0,width,height);
        for(let i=0; i<particles.length; i++) {
            const p1 = particles[i];
            p1.x += p1.vx;
            p1.y += p1.vy;
            if(p1.x < 0 || p1.x > width) p1.vx *= -1;
            if(p1.y < 0 || p1.y > height) p1.vy *= -1;
            
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 1, 0, Math.PI*2);
            ctx.fill();

            for(let j=i; j<particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 150) {
                    ctx.strokeStyle = `rgba(255,255,255,${0.05 * (1 - dist/150)})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    }
  }, []);

  return <canvas ref={canvasRef} id="neural-canvas" />;
};
