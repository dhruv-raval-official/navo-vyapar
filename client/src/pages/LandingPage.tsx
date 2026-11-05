import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Dices, Users, Award, Play, Shield, LogIn, Sparkles, Building2 } from '../components/Icons';
import { soundManager } from '../utils/sounds';

const features = [
  {
    icon: Users,
    title: 'Multiplayer On Any Device',
    description: 'Play with 2-4 real players across laptops and phones with real-time room sync.',
  },
  {
    icon: Shield,
    title: 'Authentic Indian Rules',
    description: 'Complete Navo Vyapar trading, mortgages, color monopolies, and house/hotel building.',
  },
  {
    icon: Building2,
    title: 'Landmarks of Gujarat',
    description: 'Mehsana, Ahmedabad, Surat, Dwarka, Somnath, Statue of Unity, and heritage cities.',
  },
];

// ── Interactive Particle Background Component ────────────────────────────────

function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true,
        };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Generate floating golden dust particles
    const particleCount = Math.min(45, Math.floor((width * height) / 22000));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.4 + 0.2,
      color: Math.random() > 0.3 ? '#c5a55a' : '#10b981', // Gold & Emerald
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Draw subtle glow at mouse location
      if (mouse.active) {
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 220);
        glow.addColorStop(0, 'rgba(197, 165, 90, 0.14)');
        glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce from walls
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse gravity effect
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 0.8;
            p.y += (dy / dist) * force * 0.8;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.baseAlpha;
        ctx.fill();

        // Connect nearby particles with subtle threads
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#c5a55a';
            ctx.globalAlpha = (1 - dist / 110) * 0.15;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}

// ── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const setScreen = useGameStore((s) => s.setScreen);

  const handleStart = () => {
    soundManager.buttonTap();
    setScreen('setup');
  };

  const handleJoinDirect = () => {
    soundManager.buttonTap();
    setScreen('joinRoom');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-emerald-950 flex flex-col justify-between">
      {/* Interactive Canvas Background */}
      <InteractiveBackground />

      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-900/30 via-emerald-950/70 to-emerald-950" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Navigation header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-gold">
            <Dices size={20} />
          </div>
          <div>
            <span className="font-display font-bold text-base sm:text-lg text-white tracking-wider block leading-none">
              NAVO VYAPAR
            </span>
            <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest">
              Gujarati Property Trading
            </span>
          </div>
        </div>

        {/* Clear action: Join existing room with code */}
        <button
          onClick={handleJoinDirect}
          className="btn-secondary py-1.5 sm:py-2 px-3 sm:px-4 text-xs flex items-center gap-1.5"
          title="Join with Room Code"
        >
          <LogIn size={14} className="text-gold-400" />
          <span>Join with Code</span>
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-400/30 text-gold-300 text-xs font-semibold uppercase tracking-widest mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles size={14} className="text-gold-400" />
          <span>The Traditional Gujarati Board Game</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-display text-4xl sm:text-6xl md:text-7xl font-black leading-tight tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="gold-text">NAVO VYAPAR</span>
        </motion.h1>

        {/* Humorous merchant slogan */}
        <motion.p
          className="text-emerald-200/90 text-sm sm:text-lg max-w-2xl mt-3 sm:mt-4 font-medium leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Buy landmark cities, collect hefty rent, construct grand hotels in Mehsana and Ahmedabad, and drive your rivals into bankruptcy!
        </motion.p>

        {/* Single clear CTA button */}
        <motion.div
          className="mt-6 sm:mt-8 flex flex-col items-center gap-2.5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={handleStart}
            className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3.5 flex items-center gap-2.5 shadow-gold hover:scale-105 active:scale-95 transition-transform"
          >
            <Play size={22} className="text-emerald-950 fill-emerald-950" />
            <span>Enter Vyapar (Play Now)</span>
          </button>
          <span className="text-[11px] text-gold-400/80 font-mono tracking-wide">
            Free instant guest play • No registration needed • 2 to 4 Players
          </span>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-12 w-full text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl bg-emerald-900/35 border border-gold-500/25 backdrop-blur-xs flex flex-col gap-2 transition-transform hover:-translate-y-1"
              >
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                  <Icon size={18} />
                </div>
                <h3 className="font-display font-bold text-white text-sm sm:text-base">
                  {feature.title}
                </h3>
                <p className="text-emerald-300/75 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer with Developer Credit (Tech stack omitted as requested) */}
      <footer className="relative z-10 py-4 text-center border-t border-gold-600/20 text-xs text-emerald-400/70 bg-emerald-950/90">
        <p className="font-medium">
          Navo Vyapar – Developed with pride by <strong className="text-gold-300 font-bold">Dhruv J Raval</strong>.
        </p>
        <p className="text-[10px] text-emerald-500/60 mt-0.5">
          Dedicated to Gujarat & Mehsana heritage
        </p>
      </footer>
    </div>
  );
}
