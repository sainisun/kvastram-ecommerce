'use client';

import { useEffect, useRef } from 'react';

export function ArtisanFooterAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, speed: number, size: number, opacity: number }[] = [];

    const resize = () => {
      // Need real pixel size for sharp drawing
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      // Init particles
      particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        speed: 0.2 + Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        opacity: Math.random() * 0.5 + 0.1
      }));
    };

    window.addEventListener('resize', resize);
    resize();

    let time = 0;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      time += 0.01;

      // Draw floating "threads" / dust
      const rgbString = '201, 174, 119';
      ctx.fillStyle = `rgba(${rgbString}, 0.4)`; // Gold/thread color
      particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y + Math.sin(time + p.x) * 5, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -10) p.y = rect.height + 10;
      });
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Cityscape Silhouette (Jaipur inspired) */}
      <div className="absolute bottom-0 w-full h-[120px] md:h-[200px] opacity-[0.03] flex items-end">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 200" fill="currentColor" className="w-full h-full text-inverse">
          <path d="M0,200 L1440,200 L1440,150 L1400,150 L1380,100 L1360,150 L1300,150 L1250,50 L1200,150 L1100,150 L1080,120 L1060,150 L1000,150 L950,80 L900,150 L850,150 L820,100 L790,150 L700,150 L650,60 L600,150 L550,150 L530,130 L510,150 L450,150 L400,70 L350,150 L300,150 L280,110 L260,150 L200,150 L150,40 L100,150 L50,150 L30,120 L10,150 L0,150 Z" />
        </svg>
      </div>
      
      {/* Animated Kantha Stitch Path */}
      <div className="absolute top-[30%] w-full h-[100px] opacity-10">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" className="w-full h-full text-brand-gold">
          <path 
            className="animate-dash" 
            d="M0,50 Q 180,-20 360,50 T 720,50 T 1080,50 T 1440,50" 
          />
        </svg>
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      <style jsx>{`
        .animate-dash {
          animation: stitch 20s linear infinite;
        }
        @keyframes stitch {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
