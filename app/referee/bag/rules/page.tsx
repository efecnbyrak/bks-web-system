"use client";

import Link from "next/link";
import { Key, FolderOpen, BookOpen, ChevronRight, CheckCircle, BookMarked, Scale, Users, Trophy, Layers, AlertCircle, Flag } from "lucide-react";
import { useState, useEffect } from "react";

const KURAL_CHAPTERS = [
    { icon: <Flag className="w-4 h-4" />, label: "Oyun Tanımı ve Temel Kurallar" },
    { icon: <Layers className="w-4 h-4" />, label: "Saha, Ekipman ve Malzemeler" },
    { icon: <Users className="w-4 h-4" />, label: "Takımlar, Oyuncular, Yedekler" },
    { icon: <Scale className="w-4 h-4" />, label: "Fauller ve İhlaller" },
    { icon: <Trophy className="w-4 h-4" />, label: "Oyun Düzenlemeleri ve Skor" },
];

const YORUM_TOPICS = [
    { icon: <BookMarked className="w-4 h-4" />, label: "Resmi FIBA Yorumları" },
    { icon: <AlertCircle className="w-4 h-4" />, label: "Özel Durum Açıklamaları" },
    { icon: <CheckCircle className="w-4 h-4" />, label: "Hakem Uygulamaları" },
];

const STORAGE_KEY_KURAL = "bks_rules_kural_visited";
const STORAGE_KEY_YORUM = "bks_rules_yorum_visited";

export default function RulesHubPage() {
    const [kuralVisited, setKuralVisited] = useState(false);
    const [yorumVisited, setYorumVisited] = useState(false);
    const [kuralExpanded, setKuralExpanded] = useState(false);
    const [yorumExpanded, setYorumExpanded] = useState(false);

    useEffect(() => {
        setKuralVisited(!!localStorage.getItem(STORAGE_KEY_KURAL));
        setYorumVisited(!!localStorage.getItem(STORAGE_KEY_YORUM));
    }, []);

    const markKuralVisited = () => {
        localStorage.setItem(STORAGE_KEY_KURAL, "1");
        setKuralVisited(true);
    };

    const markYorumVisited = () => {
        localStorage.setItem(STORAGE_KEY_YORUM, "1");
        setYorumVisited(true);
    };

    const progress = (kuralVisited ? 50 : 0) + (yorumVisited ? 50 : 0);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* ── HERO HEADER ── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 border border-blue-900/40">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-600/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>

                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Basketbol Kural Merkezi</p>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic mb-2">
                            Kural Kitabı
                        </h1>
                        <p className="text-blue-200/70 font-medium">
                            FIBA güncel kuralları ve resmi yorumlarına buradan ulaşabilirsin.
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[140px]">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">İlerleme</p>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black text-white leading-none">{progress}</span>
                            <span className="text-sm text-zinc-400 font-bold mb-0.5">%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1.5 font-medium">
                            {kuralVisited && yorumVisited ? "Her iki bölüm ziyaret edildi" : "Bölümleri keşfet"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── MAIN CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* KURALLAR KARTI */}
                <div className="group relative flex flex-col bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-600 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/15 hover:-translate-y-1">
                    {/* Top gradient stripe */}
                    <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-400" />

                    <div className="p-7 flex-1">
                        {/* Icon + badge row */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform duration-300">
                                <Key className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {kuralVisited && (
                                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                                        <CheckCircle className="w-3 h-3" fill="currentColor" />
                                        Ziyaret edildi
                                    </div>
                                )}
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                                    FIBA 2022
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-1">Oyun Kuralları</p>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight mb-3">
                            Kurallar
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-5">
                            Güncel FIBA basketbol oyun kurallarının tamamı. İnteraktif arama ile istediğin maddeye anında ulaş.
                        </p>

                        {/* Accordion */}
                        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setKuralExpanded(!kuralExpanded)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                                <span className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">İçindekiler</span>
                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${kuralExpanded ? "rotate-90" : ""}`} />
                            </button>
                            {kuralExpanded && (
                                <div className="px-4 py-3 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                    {KURAL_CHAPTERS.map((ch, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <span className="text-red-500 flex-shrink-0">{ch.icon}</span>
                                            <span className="font-medium">{ch.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-7 pb-7">
                        <Link
                            href="/referee/bag/rules/kural"
                            onClick={markKuralVisited}
                            className="flex items-center justify-between w-full px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 group/btn"
                        >
                            <span>Kuralları İncele</span>
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* YORUMLAR KARTI */}
                <div className="group relative flex flex-col bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-1">
                    {/* Top gradient stripe */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400" />

                    <div className="p-7 flex-1">
                        {/* Icon + badge row */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                                <FolderOpen className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {yorumVisited && (
                                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                                        <CheckCircle className="w-3 h-3" fill="currentColor" />
                                        Ziyaret edildi
                                    </div>
                                )}
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                                    RESMİ
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Resmi Açıklamalar</p>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight mb-3">
                            Yorumlar
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-5">
                            Basketbol kurallarına dair resmi FIBA yorumları ve hakem uygulamalarına yönelik açıklamalar.
                        </p>

                        {/* Accordion */}
                        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setYorumExpanded(!yorumExpanded)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                                <span className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">İçindekiler</span>
                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${yorumExpanded ? "rotate-90" : ""}`} />
                            </button>
                            {yorumExpanded && (
                                <div className="px-4 py-3 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                    {YORUM_TOPICS.map((t, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <span className="text-blue-500 flex-shrink-0">{t.icon}</span>
                                            <span className="font-medium">{t.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-7 pb-7">
                        <Link
                            href="/referee/bag/rules/yorum"
                            onClick={markYorumVisited}
                            className="flex items-center justify-between w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 group/btn"
                        >
                            <span>Yorumları İncele</span>
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── STUDY TIP ── */}
            <div className="flex items-start gap-4 p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider mb-0.5">Çalışma İpucu</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                        Önce Kurallar bölümünden ilgili maddeyi bul, ardından Yorumlar bölümünden o maddenin resmi yorumunu incele. Bu ikili çalışma hakemlik kaliteni artırır.
                    </p>
                </div>
            </div>
        </div>
    );
}
