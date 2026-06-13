"use client";

import { X, Shield, Trophy, Gem, Star, Flame, Zap, Lock } from "lucide-react";

function RankIcon({ rank }: { rank: string }) {
    const size = "w-6 h-6";
    switch (rank) {
        case "Başlangıç":
            return <Shield className={`${size} text-zinc-300`} />;
        case "Bronz":
            return (
                <svg viewBox="0 0 24 24" className={size} fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#b45309" stroke="#92400e" />
                </svg>
            );
        case "Gümüş":
            return (
                <svg viewBox="0 0 24 24" className={size} fill="none">
                    <polygon points="12,2 15.5,8.5 22,9.5 17,14.5 18.5,21 12,17.5 5.5,21 7,14.5 2,9.5 8.5,8.5" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1.5" />
                </svg>
            );
        case "Altın":
            return <Trophy className={`${size} text-amber-400`} style={{ filter: "drop-shadow(0 0 4px #fbbf24)" }} />;
        case "Elmas":
            return <Gem className={`${size} text-sky-300`} style={{ filter: "drop-shadow(0 0 6px #38bdf8)" }} />;
        default:
            return <Star className={size} />;
    }
}

export const RANKS = [
    {
        name: "Başlangıç",
        minXP: 0,
        maxXP: 500,
        icon: <RankIcon rank="Başlangıç" />,
        gradient: "from-zinc-400 to-zinc-500",
        glowColor: "shadow-zinc-400/30",
        ring: "ring-zinc-400/40",
        textColor: "text-zinc-500",
        bgColor: "bg-zinc-100 dark:bg-zinc-800",
        description: "Hakem yolculuğunun ilk adımı",
    },
    {
        name: "Bronz",
        minXP: 500,
        maxXP: 1500,
        icon: <RankIcon rank="Bronz" />,
        gradient: "from-amber-800 to-amber-600",
        glowColor: "shadow-amber-700/40",
        ring: "ring-amber-700/50",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        description: "Temel kuralları öğrenmeye başladın",
    },
    {
        name: "Gümüş",
        minXP: 1500,
        maxXP: 3500,
        icon: <RankIcon rank="Gümüş" />,
        gradient: "from-zinc-300 to-zinc-400",
        glowColor: "shadow-zinc-300/40",
        ring: "ring-zinc-300/50",
        textColor: "text-zinc-400",
        bgColor: "bg-zinc-50 dark:bg-zinc-800/60",
        description: "Kuralları kavramaya ve sınavlara girmeye başladın",
    },
    {
        name: "Altın",
        minXP: 3500,
        maxXP: 7000,
        icon: <RankIcon rank="Altın" />,
        gradient: "from-amber-400 to-yellow-300",
        glowColor: "shadow-amber-400/50",
        ring: "ring-amber-400/50",
        textColor: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        description: "Sınav başarıları ve kural kitabında ilerleme kaydediyorsun",
    },
    {
        name: "Elmas",
        minXP: 7000,
        maxXP: Infinity,
        icon: <RankIcon rank="Elmas" />,
        gradient: "from-sky-400 to-indigo-400",
        glowColor: "shadow-sky-400/60",
        ring: "ring-sky-400/60",
        textColor: "text-sky-500",
        bgColor: "bg-sky-50 dark:bg-sky-900/20",
        description: "Kural kitabını %100 tamamladın, tüm videoları izledin",
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
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ isolation: "isolate" }}
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative px-6 py-5 bg-gradient-to-br ${currentRankData.gradient} overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.1) 10px,rgba(255,255,255,0.1) 11px)" }} />
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
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

                    {/* Elmas özel */}
                    <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/10 dark:to-indigo-900/10 border border-sky-200/40 dark:border-sky-700/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-sky-500" />
                            <p className="text-xs font-black text-sky-600 dark:text-sky-400">Elmas Rankına Ulaşmak İçin</p>
                        </div>
                        <ul className="space-y-0.5">
                            {[
                                "Kural kitabını %100 tamamla",
                                "Tüm eğitim videolarını izle",
                                "25+ sınav tamamla",
                                "Tüm rozet gruplarında ilerleme kaydet",
                                "7.000 XP'ye ulaş",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-sky-400 flex-shrink-0" />
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
