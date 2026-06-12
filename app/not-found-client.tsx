"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const BALL_RADIUS = 40;
const GRAVITY = 0.45;
const SPRING = 0.07;
const FRICTION = 0.87;
const BOUNCE = 0.48;
const FLOOR_OFFSET = 80; // px from bottom of container

// SVG basketbol topu
function BallSVG() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ballGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <clipPath id="ballClip">
          <circle cx="40" cy="40" r="38" />
        </clipPath>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#ballGrad)" />
      <g clipPath="url(#ballClip)" stroke="#1c0a00" strokeWidth="2.5" fill="none" opacity="0.7">
        {/* Yatay orta çizgi */}
        <path d="M2 40 Q40 52 78 40" />
        <path d="M2 40 Q40 28 78 40" />
        {/* Dikey orta çizgi */}
        <path d="M40 2 Q52 40 40 78" />
        <path d="M40 2 Q28 40 40 78" />
      </g>
      <circle cx="40" cy="40" r="38" fill="none" stroke="#c2410c" strokeWidth="0.5" opacity="0.4" />
      {/* Parlama */}
      <ellipse cx="30" cy="26" rx="10" ry="6" fill="white" opacity="0.18" transform="rotate(-30 30 26)" />
    </svg>
  );
}

// Pota SVG
function Hoop({ swaying }: { swaying: boolean }) {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Backboard */}
      <rect x="95" y="2" width="40" height="28" rx="3" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="1.5" />
      <rect x="101" y="8" width="28" height="16" rx="1.5" fill="none" stroke="#dc2626" strokeWidth="2" />
      {/* Direk kolu */}
      <line x1="115" y1="30" x2="75" y2="42" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
      {/* Rim */}
      <ellipse cx="60" cy="44" rx="30" ry="6" fill="none" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />
      {/* File */}
      <g className={swaying ? "net-sway" : ""} style={{ transformOrigin: "60px 44px" }}>
        <line x1="36" y1="48" x2="41" y2="88" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="46" y1="49" x2="48" y2="90" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="56" y1="50" x2="56" y2="91" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="66" y1="50" x2="64" y2="91" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="76" y1="49" x2="72" y2="90" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="84" y1="48" x2="77" y2="88" stroke="#d4d4d8" strokeWidth="1.3" />
        <line x1="37" y1="58" x2="83" y2="58" stroke="#d4d4d8" strokeWidth="1" />
        <line x1="38" y1="68" x2="81" y2="68" stroke="#d4d4d8" strokeWidth="1" />
        <line x1="40" y1="78" x2="77" y2="78" stroke="#d4d4d8" strokeWidth="1" />
        <path d="M41 88 Q60 96 77 88" stroke="#d4d4d8" strokeWidth="1.3" fill="none" />
      </g>
    </svg>
  );
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const PARTICLE_COLORS = ["#dc2626", "#f59e0b", "#10b981", "#3b82f6", "#f97316", "#8b5cf6"];

export default function NotFoundClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hoopRef = useRef<HTMLDivElement>(null);

  const physics = useRef({ x: 0, y: 0, vx: 2, vy: -3, rotation: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);
  const rafRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [swaying, setSwaying] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePop, setScorePop] = useState<{ x: number; y: number; id: number } | null>(null);
  const particleId = useRef(0);

  const spawnParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: 8 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      return {
        id: particleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 5 + Math.random() * 7,
        life: 1,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((n) => n.id === p.id)));
    }, 900);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Başlangıç pozisyonu: ortanın biraz altı
    const rect = container.getBoundingClientRect();
    physics.current.x = rect.width / 2;
    physics.current.y = rect.height * 0.6;
    mouse.current.x = rect.width / 2;
    mouse.current.y = rect.height / 2;
    initialized.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouse.current.x = e.clientX - r.left;
      mouse.current.y = e.clientY - r.top;

      // 404 parallax: çok hafif ters yön
      if (titleRef.current) {
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        titleRef.current.style.transform = `translate(${dx * -12}px, ${dy * -8}px)`;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const r = container.getBoundingClientRect();
      mouse.current.x = touch.clientX - r.left;
      mouse.current.y = touch.clientY - r.top;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });

    const loop = () => {
      const p = physics.current;
      const m = mouse.current;
      const rect = container.getBoundingClientRect();
      const maxX = rect.width - BALL_RADIUS;
      const maxY = rect.height - FLOOR_OFFSET;
      const minX = BALL_RADIUS;
      const minY = BALL_RADIUS;

      // Spring kuvveti mouse'a doğru
      const ax = (m.x - p.x) * SPRING;
      const ay = (m.y - p.y) * SPRING;

      p.vx = (p.vx + ax) * FRICTION;
      p.vy = (p.vy + ay + GRAVITY) * FRICTION;

      p.x += p.vx;
      p.y += p.vy;

      // Rotation: yatay hıza göre
      p.rotation += p.vx * 1.8;

      // Sınır: yatay
      if (p.x > maxX) { p.x = maxX; p.vx *= -BOUNCE; }
      if (p.x < minX) { p.x = minX; p.vx *= -BOUNCE; }
      // Sınır: dikey
      if (p.y > maxY) { p.y = maxY; p.vy *= -BOUNCE; }
      if (p.y < minY) { p.y = minY; p.vy *= -BOUNCE; }

      // DOM güncelle
      if (ballRef.current) {
        ballRef.current.style.transform = `translate(${p.x - BALL_RADIUS}px, ${p.y - BALL_RADIUS}px) rotate(${p.rotation}deg)`;
      }

      // Gölge: top yukarıda → küçük ve soluk, aşağıda → büyük ve koyu
      if (shadowRef.current) {
        const normalY = Math.min(1, Math.max(0, (p.y - minY) / (maxY - minY)));
        const shadowScale = 0.3 + normalY * 0.7;
        const shadowOpacity = 0.08 + normalY * 0.18;
        shadowRef.current.style.transform = `translate(${p.x - 30}px, ${maxY + 8}px) scaleX(${shadowScale})`;
        shadowRef.current.style.opacity = String(shadowOpacity);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const handleBallClick = useCallback(() => {
    const p = physics.current;
    const container = containerRef.current;
    const hoop = hoopRef.current;

    // Yukarı fırlat
    p.vy = -18;
    p.vx += (Math.random() - 0.5) * 6;

    spawnParticles(p.x, p.y);

    // Pota yakınlık kontrolü
    if (hoop && container) {
      const hr = hoop.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      const hoopCenterX = hr.left - cr.left + hr.width / 2;
      const hoopCenterY = hr.top - cr.top + 44; // rim y pozisyonu
      const dist = Math.hypot(p.x - hoopCenterX, p.y - hoopCenterY);

      if (dist < 120) {
        // Sayı!
        setTimeout(() => {
          setScore((s) => s + 2);
          setSwaying(true);
          setScorePop({ x: hoopCenterX, y: hoopCenterY - 20, id: Date.now() });
          setTimeout(() => setSwaying(false), 1500);
          setTimeout(() => setScorePop(null), 900);
        }, 350);
      }
    }
  }, [spawnParticles]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleBallClick();
  }, [handleBallClick]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-white dark:bg-zinc-950 overflow-hidden select-none cursor-none"
    >
      {/* Parquet zemin */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #92400e 0px, #92400e 80px, #b45309 80px, #b45309 82px),
            repeating-linear-gradient(0deg, #92400e 0px, #92400e 80px, #b45309 80px, #b45309 82px)`,
          backgroundBlendMode: "multiply",
        }}
      />

      {/* Merkez çizgisi */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-700/8 dark:bg-amber-500/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-amber-700/8 dark:border-amber-500/10 pointer-events-none" />

      {/* Pota — sağ üst */}
      <div ref={hoopRef} className="absolute top-8 right-8 md:top-12 md:right-16 pointer-events-none z-10">
        <Hoop swaying={swaying} />
      </div>

      {/* Skor göstergesi */}
      {score > 0 && (
        <div className="absolute top-8 left-8 md:top-12 md:left-16 z-20 pointer-events-none">
          <div className="bg-zinc-900/90 dark:bg-white/10 backdrop-blur-sm border border-zinc-700/50 dark:border-white/10 rounded-2xl px-4 py-2 text-center">
            <p className="text-2xl font-black text-red-500">{score}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Puan</p>
          </div>
        </div>
      )}

      {/* Score pop */}
      {scorePop && (
        <div
          key={scorePop.id}
          className="absolute pointer-events-none z-30 font-black text-emerald-500 text-xl"
          style={{
            left: scorePop.x,
            top: scorePop.y,
            transform: "translateX(-50%)",
            animation: "score-burst 0.8s ease-out forwards",
          }}
        >
          +2
        </div>
      )}

      {/* Parçacıklar */}
      {particles.map((pt) => (
        <div
          key={pt.id}
          className="absolute pointer-events-none rounded-full z-20"
          style={{
            left: pt.x,
            top: pt.y,
            width: pt.size,
            height: pt.size,
            backgroundColor: pt.color,
            transform: "translate(-50%, -50%)",
            animation: "particle-fly 0.8s ease-out forwards",
          }}
        />
      ))}

      {/* Merkez içerik */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        {/* BKS badge */}
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 pointer-events-auto">
          <span>🏀</span>
          <span>BKS</span>
        </div>

        {/* 404 — parallax ile hareket eder */}
        <h1
          ref={titleRef}
          className="text-[110px] md:text-[150px] font-black italic tracking-tighter leading-none text-red-600 drop-shadow-[0_4px_32px_rgba(220,38,38,0.35)] transition-transform duration-75 ease-out"
          style={{ willChange: "transform" }}
        >
          404
        </h1>

        <div className="text-center mt-1">
          <p className="text-lg font-black italic tracking-tight text-zinc-900 dark:text-white">
            Sayfa bulunamadı
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Bu sayfa sahadan çıkmış, bir daha dönmeyebilir.
          </p>
        </div>

        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
          Topa tıkla veya mouse'u hareket ettir
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm uppercase tracking-[0.15em] px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 pointer-events-auto"
        >
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Top gölgesi */}
      <div
        ref={shadowRef}
        className="absolute pointer-events-none z-0"
        style={{
          width: 60,
          height: 12,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
          borderRadius: "50%",
          transformOrigin: "center center",
          opacity: 0.15,
        }}
      />

      {/* Top */}
      <div
        ref={ballRef}
        className="absolute z-20 cursor-pointer"
        style={{ width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, willChange: "transform" }}
        onClick={handleBallClick}
        onTouchStart={handleTouchStart}
      >
        <BallSVG />
      </div>
    </div>
  );
}
