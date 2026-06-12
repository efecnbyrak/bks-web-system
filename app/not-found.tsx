"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const CONFETTI_COLORS = [
  "#dc2626", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f97316",
];

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${20 + Math.random() * 30}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `confetti-fall ${0.6 + Math.random() * 0.6}s ease-out ${Math.random() * 0.3}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function BasketballHoop({ netAnimating }: { netAnimating: boolean }) {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Backboard */}
      <rect x="85" y="0" width="32" height="22" rx="2" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="1.5" />
      <rect x="90" y="5" width="22" height="12" rx="1" fill="none" stroke="#dc2626" strokeWidth="1.5" />
      {/* Pole arm */}
      <line x1="101" y1="22" x2="68" y2="30" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
      {/* Rim */}
      <ellipse cx="55" cy="32" rx="26" ry="5" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
      {/* Net */}
      <g className={netAnimating ? "net-animate" : ""} style={{ transformOrigin: "55px 32px" }}>
        <line x1="34" y1="35" x2="38" y2="68" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="42" y1="36" x2="43" y2="70" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="50" y1="37" x2="50" y2="71" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="58" y1="37" x2="57" y2="71" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="66" y1="36" x2="63" y2="70" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="74" y1="35" x2="68" y2="68" stroke="#d4d4d8" strokeWidth="1.2" />
        <line x1="34" y1="44" x2="74" y2="44" stroke="#d4d4d8" strokeWidth="1" />
        <line x1="35" y1="54" x2="71" y2="54" stroke="#d4d4d8" strokeWidth="1" />
        <line x1="37" y1="63" x2="67" y2="63" stroke="#d4d4d8" strokeWidth="1" />
        <path d="M38 68 Q55 74 68 68" stroke="#d4d4d8" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

export default function NotFound() {
  const [score, setScore] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [result, setResult] = useState<"none" | "score" | "miss">("none");
  const [netAnimating, setNetAnimating] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const shoot = useCallback(() => {
    if (shooting) return;

    const isScore = Math.random() < 0.55;
    setShooting(true);
    setResult(isScore ? "score" : "miss");
    setAttempts((a) => a + 1);

    if (isScore) {
      setTimeout(() => {
        setScore((s) => s + 2);
        setNetAnimating(true);
        setConfetti(true);
        setTimeout(() => setNetAnimating(false), 1300);
        setTimeout(() => setConfetti(false), 1000);
      }, 650);
    }

    setTimeout(() => {
      setShooting(false);
      setResult("none");
    }, 1100);
  }, [shooting]);

  const accuracy = attempts > 0 ? Math.round((score / 2 / attempts) * 100) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle parquet background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            #92400e 0px, #92400e 60px,
            #b45309 60px, #b45309 62px
          ), repeating-linear-gradient(
            0deg,
            #92400e 0px, #92400e 60px,
            #b45309 60px, #b45309 62px
          )`,
          backgroundBlendMode: "multiply",
        }}
      />

      {/* Center court line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-800/5 dark:bg-amber-600/10" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full text-center">
        {/* Logo badge */}
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
          <span>🏀</span>
          <span>BKS</span>
        </div>

        {/* 404 */}
        <div className="group cursor-default select-none">
          <h1 className="text-[120px] md:text-[160px] font-black italic tracking-tighter leading-none text-red-600 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_4px_24px_rgba(220,38,38,0.3)]">
            404
          </h1>
        </div>

        <div className="-mt-4">
          <p className="text-xl font-black italic tracking-tight text-zinc-900 dark:text-white">
            Sayfa bulunamadı
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Bu sayfa sahadan çıkmış, bir daha dönmeyebilir.
          </p>
        </div>

        {/* Game area */}
        <div className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 mt-2 relative overflow-hidden">
          <Confetti active={confetti} />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
            Bekleme sırasında oyna
          </p>

          {/* Hoop + ball area */}
          <div className="relative h-40 flex items-end justify-center">
            {/* Hoop — top right */}
            <div className="absolute top-0 right-4 md:right-8">
              <BasketballHoop netAnimating={netAnimating} />
            </div>

            {/* Ball */}
            <button
              onClick={shoot}
              disabled={shooting}
              className={[
                "relative z-10 text-5xl transition-transform select-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-full",
                shooting ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-110 active:scale-95",
                !shooting ? "ball-idle" : "",
                result === "score" ? "ball-score" : "",
                result === "miss" ? "ball-miss" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Topa bas ve say"
            >
              🏀
            </button>

            {/* Result flash */}
            {result === "score" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 text-emerald-600 font-black text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                +2 SAYИ ✓
              </div>
            )}
            {result === "miss" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 text-red-500 font-black text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                KAÇTI ✗
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-center">
              <p
                className={[
                  "text-3xl font-black text-red-600",
                  result === "score" ? "score-animate" : "",
                ].join(" ")}
              >
                {score}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">
                Puan
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-zinc-700 dark:text-zinc-300">
                {attempts}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">
                Deneme
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-zinc-700 dark:text-zinc-300">
                %{accuracy}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">
                İsabet
              </p>
            </div>
          </div>

          {score >= 20 && (
            <div className="mt-3 text-[11px] font-black text-amber-600 uppercase tracking-widest animate-in fade-in duration-500">
              🏆 Harika skor! Gerçek maçlarda da bu kadar iyi misin?
            </div>
          )}

          <p className="mt-3 text-[10px] text-zinc-400 dark:text-zinc-600">
            Topa tıkla → say
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm uppercase tracking-[0.15em] px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50"
        >
          Ana Sayfaya Dön
        </Link>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
          Hâlâ kaybolduysanız{" "}
          <a href="mailto:destek@tbf.org.tr" className="underline hover:text-red-600 transition-colors">
            destek ekibine yazın
          </a>
        </p>
      </div>
    </div>
  );
}
