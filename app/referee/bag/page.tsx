"use client";

import Link from "next/link";
import { PlayCircle, Trophy, BookOpen, Briefcase, Bell, ChevronRight, Zap, Target, Star, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function RefereeBagPage() {
    const [pendingCount, setPendingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        fetch("/api/user/assignments")
            .then(r => r.json())
            .then(data => {
                const assignments = Array.isArray(data) ? data : (data.assignments || []);
                setPendingCount(assignments.filter((a: { isCompleted: boolean }) => !a.isCompleted).length);
                setCompletedCount(assignments.filter((a: { isCompleted: boolean }) => a.isCompleted).length);
            })
            .catch(() => {});
    }, []);

    const sections = [
        {
            title: "Kural Kitabı",
            subtitle: "Profesyonel Hakem Kaynağı",
            description: "Basketbol oyun kuralları, resmi yorumlar ve hakem mekaniği dökümanlarını inceleyin.",
            bullets: ["FIBA 2024 güncel kurallar", "Resmi kural yorumları", "İnteraktif madde arama"],
            icon: <BookOpen className="w-10 h-10 text-white" />,
            iconBg: "from-blue-600 to-blue-800",
            href: "/referee/bag/rules",
            badge: "TEMEL",
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
            borderHover: "hover:border-blue-400 dark:hover:border-blue-600",
            accentColor: "text-blue-600 dark:text-blue-400",
            glow: "group-hover:shadow-blue-500/20",
            shimmer: "from-blue-600/10",
        },
        {
            title: "Soru Havuzu",
            subtitle: "Bilgi Pekiştirme Merkezi",
            description: "Kategori ve zorluk seviyesi seçerek kural sorularını çözün, ödevlerinizi tamamlayın.",
            bullets: ["8 farklı kategori", "3 zorluk seviyesi", "Ödev takip sistemi"],
            icon: <Trophy className="w-10 h-10 text-white" />,
            iconBg: "from-amber-500 to-orange-600",
            href: "/referee/bag/questions",
            badge: pendingCount > 0 ? `${pendingCount} ÖDEV` : "PRATİK",
            badgeColor: pendingCount > 0
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
            borderHover: "hover:border-amber-400 dark:hover:border-amber-600",
            accentColor: "text-amber-600 dark:text-amber-400",
            glow: "group-hover:shadow-amber-500/20",
            shimmer: "from-amber-500/10",
            hasBadge: pendingCount > 0,
        },
        {
            title: "Eğitim Videoları",
            subtitle: "Görsel Öğrenme Platformu",
            description: "Oyun içi enstantane videolarını izleyin, doğru hakem kararlarını gözlemleyin.",
            bullets: ["Kategorize video arşivi", "YouTube entegrasyonu", "İzleme takibi"],
            icon: <PlayCircle className="w-10 h-10 text-white" />,
            iconBg: "from-red-600 to-rose-700",
            href: "/referee/bag/videos",
            badge: "VİDEO",
            badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
            borderHover: "hover:border-red-400 dark:hover:border-red-600",
            accentColor: "text-red-600 dark:text-red-400",
            glow: "group-hover:shadow-red-500/20",
            shimmer: "from-red-600/10",
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">

            {/* ── HERO HEADER ── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-8 md:p-12 border border-zinc-700/50">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.08),transparent_60%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/40">
                            <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Hakem Kaynakları</span>
                            <span className="w-8 h-px bg-red-600/50" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic mb-3">
                            Hakem Çantası
                        </h1>
                        <p className="text-zinc-400 text-base md:text-lg font-medium max-w-xl">
                            Kariyerini bir üst seviyeye taşıyacak tüm eğitim materyalleri burada.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex md:flex-col gap-4 md:gap-2 shrink-0">
                        {completedCount > 0 && (
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                                <div>
                                    <div className="text-xs text-zinc-500 font-medium">Tamamlandı</div>
                                    <div className="text-lg font-black text-white leading-none">{completedCount}</div>
                                </div>
                            </div>
                        )}
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-2">
                                <Bell className="w-4 h-4 text-red-400" fill="currentColor" />
                                <div>
                                    <div className="text-xs text-red-400 font-medium">Bekleyen</div>
                                    <div className="text-lg font-black text-red-300 leading-none">{pendingCount}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress bar decoration */}
                <div className="relative z-10 mt-8 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Gelişim Alanları
                    </div>
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-bold rounded-md uppercase tracking-wide">Kurallar</span>
                        <span className="px-2 py-0.5 bg-amber-600/20 border border-amber-600/30 text-amber-400 text-[10px] font-bold rounded-md uppercase tracking-wide">Sınavlar</span>
                        <span className="px-2 py-0.5 bg-red-600/20 border border-red-600/30 text-red-400 text-[10px] font-bold rounded-md uppercase tracking-wide">Videolar</span>
                    </div>
                </div>
            </div>

            {/* ── FEATURE CARDS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <Link key={idx} href={section.href} className="flex group">
                        <div className={`
                            relative flex flex-col w-full
                            bg-white dark:bg-zinc-900
                            border-2 border-zinc-100 dark:border-zinc-800
                            ${section.borderHover}
                            rounded-[2rem] overflow-hidden
                            transition-all duration-300
                            hover:shadow-2xl ${section.glow}
                            hover:-translate-y-1
                        `}>
                            {/* Shimmer top bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${section.shimmer} to-transparent`} />

                            {/* Card Header */}
                            <div className="p-7 pb-5">
                                <div className="flex items-start justify-between mb-5">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {section.icon}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {section.hasBadge && (
                                            <div className="relative">
                                                <Bell className="w-4 h-4 text-red-500" fill="currentColor" />
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                            </div>
                                        )}
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${section.badgeColor}`}>
                                            {section.badge}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-1">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${section.accentColor} mb-1`}>
                                        {section.subtitle}
                                    </p>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>

                                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mt-2">
                                    {section.description}
                                </p>
                            </div>

                            {/* Bullet list */}
                            <div className="px-7 pb-6 flex-1">
                                <div className="space-y-2">
                                    {section.bullets.map((bullet, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-current ${section.accentColor} flex-shrink-0`} />
                                            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{bullet}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Footer */}
                            <div className={`mx-5 mb-5 flex items-center justify-between px-5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700 group-hover:border-current transition-colors`}>
                                <span className={`text-xs font-black uppercase tracking-widest ${section.accentColor}`}>
                                    Keşfet
                                </span>
                                <ChevronRight className={`w-4 h-4 ${section.accentColor} group-hover:translate-x-1 transition-transform`} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── QUICK TIP ── */}
            <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-0.5">İpucu</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Kural kitabında arama yaparak herhangi bir maddeye hızlıca ulaşabilirsin. Soru havuzunda farklı kategorileri deneyerek zayıf alanlarını keşfet.
                    </p>
                </div>
            </div>
        </div>
    );
}
