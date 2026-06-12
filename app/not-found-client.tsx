"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

// ─── Statik yıldız verisi (SSR-safe: useEffect içinde set edilir) ────────────
interface Star {
  x: number; y: number; size: number; opacity: number; twinkle: boolean; color: string;
}
const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#bfdbfe", "#fef3c7", "#e0e7ff"];

function makeStars(count: number, sizeRange: [number, number]): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    opacity: 0.4 + Math.random() * 0.6,
    twinkle: Math.random() > 0.7,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  }));
}

// ─── Astronot SVG ─────────────────────────────────────────────────────────────
function Astronaut({ rotating }: { rotating: boolean }) {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Jet pack */}
      <rect x="42" y="72" width="36" height="28" rx="6" fill="#52525b" />
      <rect x="48" y="76" width="10" height="18" rx="3" fill="#3f3f46" />
      <rect x="62" y="76" width="10" height="18" rx="3" fill="#3f3f46" />
      {/* Vücut */}
      <rect x="32" y="60" width="56" height="52" rx="14" fill="#e4e4e7" />
      {/* BKS rozeti */}
      <rect x="44" y="70" width="20" height="14" rx="3" fill="#dc2626" />
      <text x="54" y="81" textAnchor="middle" fontSize="7" fontWeight="900" fill="white" fontFamily="Arial">BKS</text>
      {/* Sol kol */}
      <rect x="14" y="64" width="20" height="30" rx="9" fill="#e4e4e7" />
      <circle cx="18" cy="97" r="7" fill="#d4d4d8" />
      {/* Sağ kol */}
      <rect x="86" y="64" width="20" height="30" rx="9" fill="#e4e4e7" />
      <circle cx="102" cy="97" r="7" fill="#d4d4d8" />
      {/* Sol bacak */}
      <rect x="38" y="108" width="18" height="26" rx="8" fill="#e4e4e7" />
      <rect x="34" y="128" width="22" height="10" rx="5" fill="#d4d4d8" />
      {/* Sağ bacak */}
      <rect x="64" y="108" width="18" height="26" rx="8" fill="#e4e4e7" />
      <rect x="64" y="128" width="22" height="10" rx="5" fill="#d4d4d8" />
      {/* Kask dış */}
      <circle cx="60" cy="40" r="34" fill="#e4e4e7" />
      {/* Vizör */}
      <ellipse cx="60" cy="40" rx="22" ry="20" fill="#0ea5e9" opacity="0.85" />
      <ellipse cx="60" cy="40" rx="22" ry="20" fill="url(#visorGrad)" />
      {/* Yansıma */}
      <ellipse cx="50" cy="30" rx="8" ry="5" fill="white" opacity="0.25" transform="rotate(-20 50 30)" />
      {/* Kask çerçeve */}
      <circle cx="60" cy="40" r="34" fill="none" stroke="#d4d4d8" strokeWidth="2.5" />
      {/* Küçük detaylar */}
      <rect x="26" y="60" width="8" height="4" rx="2" fill="#a1a1aa" />
      <rect x="86" y="60" width="8" height="4" rx="2" fill="#a1a1aa" />
      <defs>
        <radialGradient id="visorGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Jet parçacığı ────────────────────────────────────────────────────────────
interface JetParticle {
  id: number; x: number; y: number; jx: number; jy: number; color: string; size: number;
}
const JET_COLORS = ["#f59e0b", "#fb923c", "#fde68a", "#fed7aa", "#fbbf24"];

export default function NotFoundClient() {
  const layer1Ref = useRef<HTMLDivElement>(null); // derin yıldızlar
  const layer2Ref = useRef<HTMLDivElement>(null); // orta
  const layer3Ref = useRef<HTMLDivElement>(null); // yakın
  const astronautRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stars1, setStars1] = useState<Star[]>([]);
  const [stars2, setStars2] = useState<Star[]>([]);
  const [stars3, setStars3] = useState<Star[]>([]);
  const [jetParticles, setJetParticles] = useState<JetParticle[]>([]);
  const [launched, setLaunched] = useState(false);
  const jetId = useRef(0);

  // Yıldızları client'ta oluştur (SSR uyumu)
  useEffect(() => {
    setStars1(makeStars(280, [0.8, 1.5]));
    setStars2(makeStars(120, [1.5, 2.5]));
    setStars3(makeStars(40, [2.5, 4]));
  }, []);

  // Mouse parallax
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (clientX - rect.left - cx) / cx; // -1…1
      const dy = (clientY - rect.top - cy) / cy;

      if (layer1Ref.current) layer1Ref.current.style.transform = `translate(${dx * 3}px, ${dy * 3}px)`;
      if (layer2Ref.current) layer2Ref.current.style.transform = `translate(${dx * 9}px, ${dy * 9}px)`;
      if (layer3Ref.current) layer3Ref.current.style.transform = `translate(${dx * 20}px, ${dy * 20}px)`;

      // Astronot yüz döndürme
      if (astronautRef.current) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const tilt = Math.max(-18, Math.min(18, dx * 18));
        astronautRef.current.style.setProperty("--astronaut-rotate", `${tilt}deg`);
      }

      // 404 hafif ters parallax
      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${dx * -8}px, ${dy * -5}px)`;
      }
    };

    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  // Astronota tıklama → jet fırlatma
  const handleLaunch = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (launched) return;
    setLaunched(true);

    // Jet parçacıkları — astronotun alt orta noktasından aşağıya
    const rect = ("touches" in e)
      ? (e.currentTarget as HTMLElement).getBoundingClientRect()
      : (e.currentTarget as HTMLElement).getBoundingClientRect();

    const newParticles: JetParticle[] = Array.from({ length: 8 }, () => {
      const angle = (Math.PI / 2) + (Math.random() - 0.5) * 0.8; // aşağı yönlü
      const speed = 40 + Math.random() * 40;
      return {
        id: jetId.current++,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height,
        jx: Math.cos(angle) * speed,
        jy: Math.sin(angle) * speed,
        color: JET_COLORS[Math.floor(Math.random() * JET_COLORS.length)],
        size: 5 + Math.random() * 8,
      };
    });
    setJetParticles(newParticles);

    setTimeout(() => {
      setJetParticles([]);
      setLaunched(false);
    }, 700);
  }, [launched]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden select-none"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0f1729 0%, #030712 70%)" }}
    >
      {/* ── Yıldız katmanı 1: derin ── */}
      <div ref={layer1Ref} className="absolute inset-0 pointer-events-none" style={{ willChange: "transform" }}>
        {stars1.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              backgroundColor: s.color,
              opacity: s.opacity,
              animation: s.twinkle ? `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite` : undefined,
            }}
          />
        ))}
      </div>

      {/* ── Yıldız katmanı 2: orta ── */}
      <div ref={layer2Ref} className="absolute inset-0 pointer-events-none" style={{ willChange: "transform" }}>
        {stars2.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              backgroundColor: s.color,
              opacity: s.opacity,
              animation: s.twinkle ? `twinkle ${1.5 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite` : undefined,
            }}
          />
        ))}
      </div>

      {/* ── Yıldız katmanı 3: yakın ── */}
      <div ref={layer3Ref} className="absolute inset-0 pointer-events-none" style={{ willChange: "transform" }}>
        {stars3.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              backgroundColor: s.color,
              opacity: s.opacity,
              boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            }}
          />
        ))}
      </div>

      {/* ── Arka gezegen ── */}
      <div
        className="absolute pointer-events-none planet-spin"
        style={{
          width: 340, height: 340,
          bottom: "-100px", right: "-80px",
          background: "radial-gradient(circle at 35% 35%, #6d28d9, #1e1b4b 60%, #0f0a2e)",
          borderRadius: "50%",
          opacity: 0.35,
          boxShadow: "inset -20px -20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(109,40,217,0.15)",
        }}
      >
        {/* Gezegen halkası */}
        <div
          className="absolute"
          style={{
            width: "160%", height: "30%",
            top: "35%", left: "-30%",
            border: "12px solid rgba(109,40,217,0.3)",
            borderRadius: "50%",
            transform: "rotateX(70deg)",
          }}
        />
      </div>

      {/* ── Küçük ay / cisim ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 60, height: 60,
          top: "15%", left: "8%",
          background: "radial-gradient(circle at 40% 40%, #a1a1aa, #52525b)",
          borderRadius: "50%",
          opacity: 0.5,
          boxShadow: "inset -6px -6px 20px rgba(0,0,0,0.6)",
        }}
      />

      {/* ── Jet parçacıkları ── */}
      {jetParticles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none rounded-full z-50"
          style={{
            left: p.x, top: p.y,
            width: p.size, height: p.size,
            backgroundColor: p.color,
            transform: "translate(-50%, -50%)",
            "--jx": `${p.jx}px`,
            "--jy": `${p.jy}px`,
            animation: "jet-particle 0.65s ease-out forwards",
          } as React.CSSProperties}
        />
      ))}

      {/* ── Ana içerik ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">

        {/* 404 */}
        <h1
          ref={titleRef}
          className="font-black italic tracking-tighter leading-none mb-2 transition-transform duration-75 ease-out"
          style={{
            fontSize: "clamp(80px, 18vw, 180px)",
            color: "transparent",
            WebkitTextStroke: "2px rgba(255,255,255,0.15)",
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #475569 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            willChange: "transform",
            filter: "drop-shadow(0 0 40px rgba(148,163,184,0.2))",
          }}
        >
          404
        </h1>

        <p className="text-xl md:text-2xl font-black italic text-white mb-2 tracking-tight">
          Kayboldu gitti.
        </p>
        <p className="text-sm text-slate-400 font-medium max-w-xs mb-10">
          Bu sayfa sonsuz uzayda bir yerlerde süzülüyor olabilir.
        </p>

        {/* Astronot */}
        <div
          ref={astronautRef}
          className="astronaut-float cursor-pointer mb-10"
          style={{ willChange: "transform" }}
          onClick={handleLaunch}
          onTouchStart={handleLaunch}
        >
          <Astronaut rotating={launched} />
          {/* Jet alevi — tıklanınca */}
          {launched && (
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: -16 }}
            >
              <div
                className="w-3 rounded-full"
                style={{
                  height: 28,
                  background: "linear-gradient(to bottom, #fbbf24, #f97316, transparent)",
                  animation: "jet-particle 0.5s ease-out forwards",
                  "--jx": "0px",
                  "--jy": "20px",
                } as React.CSSProperties}
              />
            </div>
          )}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-6">
          Astronota tıkla veya mouse'u hareket ettir
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm uppercase tracking-[0.12em] px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50"
          >
            Ana Sayfaya Dön
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-slate-300 font-black text-sm uppercase tracking-[0.12em] px-6 py-3 rounded-2xl transition-all duration-200"
          >
            Geri Git
          </button>
        </div>
      </div>
    </div>
  );
}
