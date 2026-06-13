"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Trophy, BookOpen, Zap, Target, Award, Lock, Flame, Shield, Crown, Gem, GraduationCap, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ExamAttempt {
    id: number;
    score: number;
    totalQuestions: number;
    difficulty: string | null;
    createdAt: string;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    detail: string;
    icon: React.ReactNode;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
    ringColor: string;
    textColor: string;
    condition: (data: AchievementData) => boolean;
    progress?: (data: AchievementData) => { current: number; max: number };
    xp: number;
}

interface AchievementData {
    completedAssignments: number;
    totalAssignments: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    examAttempts: ExamAttempt[];
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_assignment",
        title: "İlk Adım",
        description: "İlk görevi tamamla",
        detail: "Yolculuk ilk adımla başlar",
        icon: <Star className="w-6 h-6" />,
        glowColor: "shadow-amber-400/40",
        gradientFrom: "from-amber-400",
        gradientTo: "to-yellow-500",
        ringColor: "ring-amber-400/30",
        textColor: "text-amber-500",
        condition: (d) => d.completedAssignments >= 1,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 1), max: 1 }),
        xp: 50,
    },
    {
        id: "five_assignments",
        title: "Çalışkan Hakem",
        description: "5 görev tamamla",
        detail: "Kararlılık ve azimle ilerle",
        icon: <Flame className="w-6 h-6" />,
        glowColor: "shadow-orange-400/40",
        gradientFrom: "from-orange-400",
        gradientTo: "to-red-500",
        ringColor: "ring-orange-400/30",
        textColor: "text-orange-500",
        condition: (d) => d.completedAssignments >= 5,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 5), max: 5 }),
        xp: 150,
    },
    {
        id: "ten_assignments",
        title: "Kural Ustası",
        description: "10 görev tamamla",
        detail: "Uzmanlık deneyimle gelir",
        icon: <Award className="w-6 h-6" />,
        glowColor: "shadow-purple-400/40",
        gradientFrom: "from-purple-500",
        gradientTo: "to-indigo-600",
        ringColor: "ring-purple-400/30",
        textColor: "text-purple-500",
        condition: (d) => d.completedAssignments >= 10,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 10), max: 10 }),
        xp: 300,
    },
    {
        id: "kural_visited",
        title: "Kural Okuyucu",
        description: "Kural kitabını aç",
        detail: "Bilgi güçtür",
        icon: <BookOpen className="w-6 h-6" />,
        glowColor: "shadow-blue-400/40",
        gradientFrom: "from-blue-400",
        gradientTo: "to-cyan-500",
        ringColor: "ring-blue-400/30",
        textColor: "text-blue-500",
        condition: (d) => d.kuralVisited,
        xp: 30,
    },
    {
        id: "yorum_visited",
        title: "Yorum Takipçisi",
        description: "Resmi yorumları incele",
        detail: "Derinlemesine analiz",
        icon: <Zap className="w-6 h-6" />,
        glowColor: "shadow-cyan-400/40",
        gradientFrom: "from-cyan-400",
        gradientTo: "to-teal-500",
        ringColor: "ring-cyan-400/30",
        textColor: "text-cyan-500",
        condition: (d) => d.yorumVisited,
        xp: 30,
    },
    {
        id: "all_complete",
        title: "Eksiksiz Hakem",
        description: "Tüm ödevleri tamamla",
        detail: "Mükemmelliğin zirvesi",
        icon: <Target className="w-6 h-6" />,
        glowColor: "shadow-rose-400/40",
        gradientFrom: "from-rose-500",
        gradientTo: "to-pink-600",
        ringColor: "ring-rose-400/30",
        textColor: "text-rose-500",
        condition: (d) => d.totalAssignments > 0 && d.completedAssignments === d.totalAssignments,
        progress: (d) => ({ current: d.completedAssignments, max: Math.max(d.totalAssignments, 1) }),
        xp: 200,
    },
    // Sınav başarıları
    {
        id: "ilk_sinav",
        title: "Sınav Başlangıcı",
        description: "İlk sınavını tamamla",
        detail: "Her uzman bir kez başlangıç yapar",
        icon: <GraduationCap className="w-6 h-6" />,
        glowColor: "shadow-violet-400/40",
        gradientFrom: "from-violet-500",
        gradientTo: "to-purple-600",
        ringColor: "ring-violet-400/30",
        textColor: "text-violet-500",
        condition: (d) => d.examAttempts.length >= 1,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 1), max: 1 }),
        xp: 50,
    },
    {
        id: "sinav_gecti",
        title: "Başarılı Hakem",
        description: "Bir sınavda %80 veya üzeri al",
        detail: "Yüksek performansın kanıtı",
        icon: <CheckCircle className="w-6 h-6" />,
        glowColor: "shadow-emerald-400/40",
        gradientFrom: "from-emerald-500",
        gradientTo: "to-green-600",
        ringColor: "ring-emerald-400/30",
        textColor: "text-emerald-500",
        condition: (d) => d.examAttempts.some(a => (a.score / a.totalQuestions) >= 0.8),
        xp: 100,
    },
    {
        id: "uc_sinav",
        title: "Denemeci",
        description: "3 sınav tamamla",
        detail: "Sürekli gelişim her adımda",
        icon: <Star className="w-6 h-6" />,
        glowColor: "shadow-indigo-400/40",
        gradientFrom: "from-indigo-500",
        gradientTo: "to-blue-600",
        ringColor: "ring-indigo-400/30",
        textColor: "text-indigo-500",
        condition: (d) => d.examAttempts.length >= 3,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 3), max: 3 }),
        xp: 150,
    },
    {
        id: "zor_sinav",
        title: "Zorlu Yolu Seçen",
        description: "Zor seviyede sınav tamamla",
        detail: "Güçlükle büyürsün",
        icon: <Trophy className="w-6 h-6" />,
        glowColor: "shadow-red-400/40",
        gradientFrom: "from-red-500",
        gradientTo: "to-rose-600",
        ringColor: "ring-red-400/30",
        textColor: "text-red-500",
        condition: (d) => d.examAttempts.some(a => a.difficulty === "Zor"),
        xp: 200,
    },
];

const LEVELS = [
    { name: "Bronz", minXP: 0, maxXP: 100, icon: <Shield className="w-4 h-4" />, gradient: "from-amber-700 to-amber-500", ring: "ring-amber-600/40" },
    { name: "Gümüş", minXP: 100, maxXP: 300, icon: <Shield className="w-4 h-4" />, gradient: "from-zinc-400 to-zinc-300", ring: "ring-zinc-400/40" },
    { name: "Altın", minXP: 300, maxXP: 760, icon: <Trophy className="w-4 h-4" />, gradient: "from-amber-400 to-yellow-300", ring: "ring-amber-400/40" },
    { name: "Platin", minXP: 760, maxXP: 1060, icon: <Crown className="w-4 h-4" />, gradient: "from-teal-400 to-cyan-300", ring: "ring-teal-400/40" },
    { name: "Elmas", minXP: 1060, maxXP: 1260, icon: <Gem className="w-4 h-4" />, gradient: "from-sky-400 to-indigo-400", ring: "ring-sky-400/50" },
];

function getLevel(xp: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXP) return { level: LEVELS[i], index: i };
    }
    return { level: LEVELS[0], index: 0 };
}

function CircularProgress({ percent, size = 80, stroke = 7, gradient }: { percent: number; size?: number; stroke?: number; gradient: string }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const gradId = `grad-${Math.round(percent)}`;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={gradient.includes("amber") ? "#f59e0b" : gradient.includes("zinc") ? "#a1a1aa" : gradient.includes("teal") ? "#2dd4bf" : gradient.includes("sky") ? "#38bdf8" : "#f59e0b"} />
                    <stop offset="100%" stopColor={gradient.includes("amber") ? "#fbbf24" : gradient.includes("zinc") ? "#d4d4d8" : gradient.includes("teal") ? "#67e8f9" : gradient.includes("sky") ? "#818cf8" : "#fbbf24"} />
                </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-200 dark:text-zinc-700" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
            />
        </svg>
    );
}

function AchievementCard({ achievement, earned, data }: { achievement: Achievement; earned: boolean; data: AchievementData }) {
    const prog = achievement.progress ? achievement.progress(data) : null;
    const progPct = prog ? Math.round((prog.current / prog.max) * 100) : (earned ? 100 : 0);

    if (!earned) {
        return (
            <div className="relative group rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40 p-4 flex flex-col gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.015)_8px,rgba(0,0,0,0.015)_9px)] pointer-events-none" />
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 truncate">{achievement.title}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5 line-clamp-2">{achievement.description}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        +{achievement.xp} XP
                    </span>
                </div>
                {prog && (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-zinc-400 font-medium">{prog.current}/{prog.max}</span>
                            <span className="text-[9px] text-zinc-400">{progPct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-700" style={{ width: `${progPct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`relative group rounded-2xl border border-transparent bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3 overflow-hidden shadow-lg ${achievement.glowColor} ring-2 ${achievement.ringColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradientFrom} ${achievement.gradientTo} opacity-[0.04] pointer-events-none`} />
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${achievement.gradientFrom} ${achievement.gradientTo} rounded-bl-full`} />
            </div>
            <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${achievement.gradientFrom} ${achievement.gradientTo} flex items-center justify-center flex-shrink-0 shadow-md ${achievement.glowColor}`}>
                    <span className="text-white">{achievement.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black truncate ${achievement.textColor}`}>{achievement.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{achievement.detail}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${achievement.gradientFrom} ${achievement.gradientTo} text-white flex-shrink-0 shadow-sm`}>
                    +{achievement.xp} XP
                </span>
            </div>
            <div>
                <div className="flex justify-between mb-1">
                    <span className={`text-[9px] font-bold ${achievement.textColor}`}>Tamamlandı</span>
                    <span className={`text-[9px] font-bold ${achievement.textColor}`}>100%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${achievement.gradientFrom} ${achievement.gradientTo} rounded-full`} style={{ width: "100%" }} />
                </div>
            </div>
        </div>
    );
}

function getScoreStyle(score: number, total: number) {
    const pct = (score / total) * 100;
    if (pct >= 80) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-3.5 h-3.5" /> };
    if (pct >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: <CheckCircle className="w-3.5 h-3.5" /> };
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: <XCircle className="w-3.5 h-3.5" /> };
}

function ExamHistorySection({ attempts }: { attempts: ExamAttempt[] }) {
    const shown = attempts.slice(0, 5);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white">Sınav Geçmişim</h3>
                        <p className="text-[10px] text-zinc-400">{attempts.length} sınav tamamlandı</p>
                    </div>
                </div>
                {attempts.length > 0 && (
                    <Link href="/referee/results" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                        Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>

            {attempts.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-3">
                        <GraduationCap className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">Henüz sınava girmedin</p>
                    <p className="text-[11px] text-zinc-400 mb-4">Sınava girerek başarı rozetleri kazan ve kendini geliştir.</p>
                    <Link href="/referee/exam" className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm">
                        Sınava Gir
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {shown.map((attempt) => {
                        const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        const style = getScoreStyle(attempt.score, attempt.totalQuestions);
                        return (
                            <div key={attempt.id} className="flex items-center gap-3 px-5 py-3">
                                <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 ${style.text}`}>
                                    {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-sm font-black ${style.text}`}>{attempt.score}/{attempt.totalQuestions}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}>%{pct}</span>
                                        {attempt.difficulty && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{attempt.difficulty}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                        {format(new Date(attempt.createdAt), "d MMM yyyy, HH:mm", { locale: tr })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {attempts.length > 5 && (
                        <div className="px-5 py-3 text-center">
                            <Link href="/referee/results" className="text-[11px] font-bold text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                                +{attempts.length - 5} sınav daha → Tümünü Gör
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AchievementsSection() {
    const [data, setData] = useState<AchievementData>({
        completedAssignments: 0,
        totalAssignments: 0,
        kuralVisited: false,
        yorumVisited: false,
        examAttempts: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/user/assignments").then(r => r.json()),
            fetch("/api/user/exam-history").then(r => r.json()),
        ])
            .then(([assignmentData, examData]) => {
                const assignments = Array.isArray(assignmentData)
                    ? assignmentData
                    : (assignmentData.assignments || []);
                const kuralVisited = Array.isArray(assignmentData) ? false : !!assignmentData.kuralVisited;
                const yorumVisited = Array.isArray(assignmentData) ? false : !!assignmentData.yorumVisited;
                setData({
                    completedAssignments: assignments.filter((a: { isCompleted: boolean }) => a.isCompleted).length,
                    totalAssignments: assignments.length,
                    kuralVisited,
                    yorumVisited,
                    examAttempts: examData.attempts || [],
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const earned = ACHIEVEMENTS.filter(a => a.condition(data));
    const locked = ACHIEVEMENTS.filter(a => !a.condition(data));
    const totalXP = earned.reduce((sum, a) => sum + a.xp, 0);
    const maxXP = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);
    const xpPercent = maxXP > 0 ? Math.round((totalXP / maxXP) * 100) : 0;
    const { level, index: levelIndex } = getLevel(totalXP);
    const nextLevel = LEVELS[levelIndex + 1];
    const xpInLevel = totalXP - level.minXP;
    const xpToNext = nextLevel ? nextLevel.minXP - level.minXP : level.maxXP - level.minXP;
    const levelPct = Math.round((xpInLevel / xpToNext) * 100);

    const nextUnearned = ACHIEVEMENTS.find(a => !a.condition(data) && a.progress);
    const nextProg = nextUnearned?.progress ? nextUnearned.progress(data) : null;
    const nextRemaining = nextProg ? nextProg.max - nextProg.current : null;

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                <div className="flex gap-4 mb-6">
                    <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                    <div className="flex-1 space-y-2 pt-2">
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-3" />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Hero header */}
                <div className="relative px-6 py-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-100/60 to-transparent dark:from-amber-900/10 rounded-bl-full pointer-events-none" />

                    <div className="relative flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <CircularProgress percent={xpPercent} size={84} stroke={7} gradient={level.gradient} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 leading-none">{totalXP}</span>
                                <span className="text-[8px] text-zinc-400 leading-none mt-0.5">XP</span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${level.gradient} shadow-sm`}>
                                    <span className="text-white">{level.icon}</span>
                                    <span className="text-[10px] font-black text-white tracking-wide">{level.name}</span>
                                </div>
                                <span className="text-xs text-zinc-400 font-medium">{earned.length}/{ACHIEVEMENTS.length} rozet</span>
                            </div>
                            <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">Başarılar</h3>

                            {nextLevel && (
                                <div className="mt-2">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[9px] text-zinc-400 font-medium">{level.name} → {nextLevel.name}</span>
                                        <span className="text-[9px] text-zinc-400">{xpInLevel}/{xpToNext} XP</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${level.gradient} rounded-full transition-all duration-1000`}
                                            style={{ width: `${Math.min(levelPct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 text-right">
                            <div className="text-2xl font-black text-amber-500 leading-none">{totalXP}</div>
                            <div className="text-[9px] text-zinc-400 font-medium mt-0.5">/ {maxXP} XP</div>
                        </div>
                    </div>

                    {nextRemaining !== null && nextUnearned && (
                        <div className="relative mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/40 backdrop-blur-sm">
                            <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${nextUnearned.gradientFrom} ${nextUnearned.gradientTo} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-white scale-75">{nextUnearned.icon}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-300">
                                <span className="font-bold">{nextUnearned.title}</span> için{" "}
                                <span className={`font-black ${nextUnearned.textColor}`}>{nextRemaining} {nextUnearned.id.includes("sinav") || nextUnearned.id.includes("ilk_sinav") ? "sınav" : "görev"}</span> daha tamamla
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Achievements grid */}
                <div className="p-5">
                    {earned.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Kazanıldı ({earned.length})</span>
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {earned.map(a => (
                                    <AchievementCard key={a.id} achievement={a} earned data={data} />
                                ))}
                            </div>
                        </div>
                    )}

                    {locked.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Kilitli ({locked.length})</span>
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {locked.map(a => (
                                    <AchievementCard key={a.id} achievement={a} earned={false} data={data} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sınav Geçmişi */}
            <ExamHistorySection attempts={data.examAttempts} />
        </div>
    );
}
