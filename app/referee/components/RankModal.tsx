"use client";

import { X, Shield, Trophy, Crown, Gem, Star, Flame, Zap, Lock } from "lucide-react";

export const RANKS = [
    {
        name: "Başlangıç",
        minXP: 0,
        maxXP: 100,
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-zinc-400 to-zinc-500",
        glowColor: "shadow-zinc-400/30",
        ring: "ring-zinc-400/40",
        textColor: "text-zinc-500",
        bgColor: "bg-zinc-100 dark:bg-zinc-800",
        description: "Hakem yolculuğunun ilk adımı",
    },
    {
        name: "Bronz",
        minXP: 100,
        maxXP: 500,
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-amber-700 to-amber-500",
        glowColor: "shadow-amber-600/30",
        ring: "ring-amber-600/40",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        description: "Temel kuralları öğrenmeye başladın",
    },
    {
        name: "Gümüş",
        minXP: 500,
        maxXP: 1500,
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-zinc-400 to-zinc-300",
        glowColor: "shadow-zinc-400/30",
        ring: "ring-zinc-400/40",
        textColor: "text-zinc-500",
        bgColor: "bg-zinc-50 dark:bg-zinc-800/60",
        description: "Kuralları kavramaya ve sınavlara girmeye başladın",
    },
    {
        name: "Altın",
        minXP: 1500,
        maxXP: 4000,
        icon: <Trophy className="w-5 h-5" />,
        gradient: "from-amber-400 to-yellow-300",
        glowColor: "shadow-amber-400/40",
        ring: "ring-amber-400/40",
        textColor: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        description: "Sınav başarıları ve kural kitabında ilerleme kaydediyorsun",
    },
    {
        name: "Platin",
        minXP: 4000,
        maxXP: 8000,
        icon: <Crown className="w-5 h-5" />,
        gradient: "from-teal-400 to-cyan-300",
        glowColor: "shadow-teal-400/40",
        ring: "ring-teal-400/40",
        textColor: "text-teal-500",
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        description: "Kural kitabının büyük bölümünü bitirdin, zorlu sınavlara hazırsın",
    },
    {
        name: "Elmas",
        minXP: 8000,
        maxXP: 15000,
        icon: <Gem className="w-5 h-5" />,
        gradient: "from-sky-400 to-indigo-400",
        glowColor: "shadow-sky-400/50",
        ring: "ring-sky-400/50",
        textColor: "text-sky-500",
        bgColor: "bg-sky-50 dark:bg-sky-900/20",
        description: "Kural kitabını %100 tamamladın, tüm videoları izledin",
    },
    {
        name: "Master",
        minXP: 15000,
        maxXP: 25000,
        icon: <Star className="w-5 h-5" />,
        gradient: "from-violet-500 to-purple-400",
        glowColor: "shadow-violet-500/40",
        ring: "ring-violet-500/40",
        textColor: "text-violet-500",
        bgColor: "bg-violet-50 dark:bg-violet-900/20",
        description: "25+ sınav, mükemmel skorlar, sistemin hakimisin",
    },
    {
        name: "Legend",
        minXP: 25000,
        maxXP: Infinity,
        icon: <Crown className="w-5 h-5" />,
        gradient: "from-rose-500 via-orange-400 to-amber-300",
        glowColor: "shadow-rose-500/50",
        ring: "ring-rose-500/50",
        textColor: "text-rose-500",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        description: "Tüm başarıları tamamladın. BKS'nin efsanesi oldun!",
    },
];

function getRankIndex(rankName: string): number {
    return RANKS.findIndex((r) => r.name === rankName);
}

interface RankModalProps {
    currentXP: number;
    currentRank: string;
    onClose: () => void;
}

export function RankModal({ currentXP, currentRank, onClose }: RankModalProps) {
    const currentIndex = getRankIndex(currentRank);
    const nextRank = RANKS[currentIndex + 1];
    const xpToNext = nextRank ? nextRank.minXP - currentXP : 0;
    const currentRankData = RANKS[currentIndex] ?? RANKS[0];
    const progressInRank = currentXP - currentRankData.minXP;
    const rangeSize = nextRank ? nextRank.minXP - currentRankData.minXP : currentRankData.maxXP - currentRankData.minXP;
    const progressPct = Math.min(100, Math.round((progressInRank / rangeSize) * 100));

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative px-6 py-5 bg-gradient-to-br ${currentRankData.gradient} overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.1) 10px,rgba(255,255,255,0.1) 11px)" }} />
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="relative flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30`}>
                            <span className="text-white scale-150">{currentRankData.icon}</span>
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Mevcut Rank</p>
                            <h2 className="text-2xl font-black text-white">{currentRank}</h2>
                            <p className="text-white/80 text-sm font-medium mt-0.5">{currentXP.toLocaleString("tr-TR")} XP</p>
                        </div>
                    </div>

                    {nextRank && (
                        <div className="relative mt-4">
                            <div className="flex justify-between text-[11px] text-white/70 mb-1.5 font-medium">
                                <span>{currentRank}</span>
                                <span>{nextRank.name} için {xpToNext.toLocaleString("tr-TR")} XP daha</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/80 rounded-full transition-all duration-700"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Rank Listesi */}
                <div className="p-4 max-h-[60vh] overflow-y-auto modern-scrollbar">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-3">Tüm Ranklar</p>
                    <div className="space-y-2">
                        {RANKS.map((rank, index) => {
                            const isCurrent = rank.name === currentRank;
                            const isUnlocked = currentXP >= rank.minXP;
                            const isNext = index === currentIndex + 1;

                            return (
                                <div
                                    key={rank.name}
                                    className={`relative flex items-center gap-3 p-3 rounded-2xl transition-all ${
                                        isCurrent
                                            ? `${rank.bgColor} ring-2 ${rank.ring} shadow-md ${rank.glowColor}`
                                            : isUnlocked
                                            ? "bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/40"
                                            : "bg-zinc-50/50 dark:bg-zinc-800/20 border border-dashed border-zinc-200 dark:border-zinc-700/30 opacity-60"
                                    }`}
                                >
                                    {isCurrent && (
                                        <div className={`absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${rank.gradient}`} />
                                    )}

                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        isUnlocked
                                            ? `bg-gradient-to-br ${rank.gradient} shadow-sm`
                                            : "bg-zinc-200 dark:bg-zinc-700"
                                    }`}>
                                        <span className={isUnlocked ? "text-white" : "text-zinc-400"}>
                                            {isUnlocked ? rank.icon : <Lock className="w-4 h-4" />}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-black ${isCurrent ? rank.textColor : isUnlocked ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400"}`}>
                                                {rank.name}
                                            </p>
                                            {isCurrent && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r ${rank.gradient} text-white`}>
                                                    Mevcut
                                                </span>
                                            )}
                                            {isNext && !isUnlocked && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500">
                                                    Sıradaki
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{rank.description}</p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-[11px] font-black ${isCurrent ? rank.textColor : "text-zinc-400"}`}>
                                            {rank.minXP.toLocaleString("tr-TR")}
                                        </p>
                                        <p className="text-[9px] text-zinc-400">XP</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend özel */}
                    <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-900/10 dark:to-amber-900/10 border border-rose-200/40 dark:border-rose-700/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <p className="text-xs font-black text-rose-600 dark:text-rose-400">Legend Rankına Ulaşmak İçin</p>
                        </div>
                        <ul className="space-y-0.5">
                            {[
                                "Kural kitabını %100 tamamla",
                                "Tüm eğitim videolarını izle",
                                "25+ sınav tamamla",
                                "Tüm rozet gruplarında ilerleme kaydet",
                                "25.000 XP'ye ulaş",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
