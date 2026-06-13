"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllUsersAchievements, UserAchievementData } from "@/app/actions/admin-achievements";
import {
    Loader2,
    Trophy,
    ChevronDown,
    ChevronUp,
    Search,
    BookOpen,
    GraduationCap,
    Star,
    Shield,
    Crown,
    Gem,
    Medal,
} from "lucide-react";

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    "Başlangıç": { color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800", icon: <Shield className="w-3.5 h-3.5" /> },
    Bronz: { color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30", icon: <Shield className="w-3.5 h-3.5" /> },
    Gümüş: { color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800", icon: <Shield className="w-3.5 h-3.5" /> },
    Altın: { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", icon: <Trophy className="w-3.5 h-3.5" /> },
    Platin: { color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20", icon: <Crown className="w-3.5 h-3.5" /> },
    Elmas: { color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20", icon: <Gem className="w-3.5 h-3.5" /> },
    Master: { color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", icon: <Star className="w-3.5 h-3.5" /> },
    Legend: { color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", icon: <Crown className="w-3.5 h-3.5" /> },
};

const LEVELS = ["Tümü", "Başlangıç", "Bronz", "Gümüş", "Altın", "Platin", "Elmas", "Master", "Legend"];
const USER_TYPES = ["Tümü", "Hakem", "Görevli"];

export default function AchievementsPage() {
    const [data, setData] = useState<UserAchievementData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("Tümü");
    const [levelFilter, setLevelFilter] = useState("Tümü");

    useEffect(() => {
        getAllUsersAchievements().then(res => {
            if (res.success && res.data) setData(res.data);
            setLoading(false);
        });
    }, []);

    const filtered = useMemo(() => {
        return data.filter(u => {
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
            const matchSearch = search.trim() === "" ||
                fullName.includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchType =
                typeFilter === "Tümü" ||
                (typeFilter === "Hakem" && u.type === "referee") ||
                (typeFilter === "Görevli" && u.type === "official");
            const matchLevel = levelFilter === "Tümü" || u.rank === levelFilter;
            return matchSearch && matchType && matchLevel;
        });
    }, [data, search, typeFilter, levelFilter]);

    const toggleExpand = (key: string) => setExpanded(prev => prev === key ? null : key);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                    <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-zinc-900 dark:text-white">Başarılar</h1>
                    <p className="text-xs text-zinc-500">{data.length} kullanıcı • XP&apos;ye göre sıralanmış</p>
                </div>
            </div>

            {/* Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="İsim veya e-posta ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                </div>
                <div className="flex gap-2">
                    {USER_TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${typeFilter === t
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {LEVELS.map(l => {
                        const cfg = LEVEL_CONFIG[l];
                        return (
                            <button
                                key={l}
                                onClick={() => setLevelFilter(l)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${levelFilter === l
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    }`}
                            >
                                {cfg && <span className={cfg.color}>{cfg.icon}</span>}
                                {l}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tablo */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
                        <Medal className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Sonuç bulunamadı</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {/* Başlık */}
                        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                            <span>Kullanıcı</span>
                            <span>Tür</span>
                            <span>Seviye</span>
                            <span>XP</span>
                            <span>Kural Okunan</span>
                            <span>Sınav</span>
                            <span></span>
                        </div>

                        {filtered.map(u => {
                            const key = `${u.type}-${u.id}`;
                            const isExpanded = expanded === key;
                            const levelCfg = LEVEL_CONFIG[u.rank] ?? LEVEL_CONFIG["Bronz"];
                            const avgScore = u.examAttempts.length > 0
                                ? Math.round(u.examAttempts.reduce((acc, a) => acc + (a.score / a.totalQuestions) * 100, 0) / u.examAttempts.length)
                                : null;

                            return (
                                <div key={key}>
                                    <div
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                        onClick={() => toggleExpand(key)}
                                    >
                                        {/* Kullanıcı */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 text-xs font-black text-zinc-600 dark:text-zinc-300">
                                                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                                                <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                                            </div>
                                        </div>

                                        {/* Tür */}
                                        <span className="text-xs text-zinc-500">
                                            {u.type === "referee" ? "Hakem" : "Görevli"} · {u.category}
                                        </span>

                                        {/* Seviye */}
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold w-fit ${levelCfg.bg} ${levelCfg.color}`}>
                                            {levelCfg.icon}
                                            {u.rank}
                                        </span>

                                        {/* XP */}
                                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">{u.xp} XP</span>

                                        {/* Kural */}
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                                            <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                            {u.ruleProgressCount + u.yorumProgressCount}
                                        </div>

                                        {/* Sınav */}
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                                            <GraduationCap className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                            {u.examAttempts.length}
                                            {avgScore !== null && (
                                                <span className={`text-[11px] font-bold ${avgScore >= 80 ? "text-emerald-500" : avgScore >= 60 ? "text-amber-500" : "text-red-500"}`}>
                                                    ({avgScore}%)
                                                </span>
                                            )}
                                        </div>

                                        {/* Genişlet */}
                                        <div className="flex items-center justify-center text-zinc-400">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    {/* Genişletilmiş detay */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 bg-zinc-50 dark:bg-zinc-800/30 space-y-4">
                                            {/* Kazanılan rozetler */}
                                            {u.earnedAchievements.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-2">Kazanılan Rozetler</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {u.earnedAchievements.map(a => (
                                                            <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                                                                <Star className="w-3 h-3" />
                                                                {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kural ilerleme */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-[11px] text-zinc-400 mb-1">Kural Okunmuş</p>
                                                    <p className="text-lg font-black text-zinc-900 dark:text-white">{u.ruleProgressCount}</p>
                                                </div>
                                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-[11px] text-zinc-400 mb-1">Yorum Okunmuş</p>
                                                    <p className="text-lg font-black text-zinc-900 dark:text-white">{u.yorumProgressCount}</p>
                                                </div>
                                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-[11px] text-zinc-400 mb-1">Kural Bölümü</p>
                                                    <p className={`text-sm font-bold ${u.kuralVisited ? "text-emerald-500" : "text-zinc-400"}`}>
                                                        {u.kuralVisited ? "Ziyaret Edildi" : "Ziyaret Edilmedi"}
                                                    </p>
                                                </div>
                                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                                                    <p className="text-[11px] text-zinc-400 mb-1">Yorum Bölümü</p>
                                                    <p className={`text-sm font-bold ${u.yorumVisited ? "text-emerald-500" : "text-zinc-400"}`}>
                                                        {u.yorumVisited ? "Ziyaret Edildi" : "Ziyaret Edilmedi"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Son sınavlar */}
                                            {u.examAttempts.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-2">Son Sınavlar</p>
                                                    <div className="space-y-2">
                                                        {u.examAttempts.slice(0, 5).map(a => {
                                                            const pct = Math.round((a.score / a.totalQuestions) * 100);
                                                            return (
                                                                <div key={a.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl px-4 py-2.5 border border-zinc-200 dark:border-zinc-700">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : pct >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                                            {pct}%
                                                                        </span>
                                                                        <span className="text-xs text-zinc-500">{a.score}/{a.totalQuestions} doğru</span>
                                                                        {a.difficulty && (
                                                                            <span className="text-[11px] text-zinc-400">{a.difficulty}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-zinc-400">
                                                                        {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
