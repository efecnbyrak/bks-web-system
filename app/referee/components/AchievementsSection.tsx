"use client";

import { useEffect, useState } from "react";
import { Star, Trophy, BookOpen, Zap, Target, Award, Lock } from "lucide-react";

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    condition: (data: AchievementData) => boolean;
    xp: number;
}

interface AchievementData {
    completedAssignments: number;
    totalAssignments: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_assignment",
        title: "İlk Adım",
        description: "İlk ödevi tamamla",
        icon: <Star className="w-5 h-5" />,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        condition: (d) => d.completedAssignments >= 1,
        xp: 50,
    },
    {
        id: "five_assignments",
        title: "Çalışkan Hakem",
        description: "5 ödev tamamla",
        icon: <Trophy className="w-5 h-5" />,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        condition: (d) => d.completedAssignments >= 5,
        xp: 150,
    },
    {
        id: "ten_assignments",
        title: "Kural Ustası",
        description: "10 ödev tamamla",
        icon: <Award className="w-5 h-5" />,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        condition: (d) => d.completedAssignments >= 10,
        xp: 300,
    },
    {
        id: "kural_visited",
        title: "Kural Okuyucu",
        description: "Kural kitabını aç",
        icon: <BookOpen className="w-5 h-5" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        condition: (d) => d.kuralVisited,
        xp: 30,
    },
    {
        id: "yorum_visited",
        title: "Yorum Takipçisi",
        description: "Resmi yorumları incele",
        icon: <Zap className="w-5 h-5" />,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
        borderColor: "border-cyan-200 dark:border-cyan-800",
        condition: (d) => d.yorumVisited,
        xp: 30,
    },
    {
        id: "all_complete",
        title: "Eksiksiz Hakem",
        description: "Tüm ödevleri tamamla",
        icon: <Target className="w-5 h-5" />,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        condition: (d) => d.totalAssignments > 0 && d.completedAssignments === d.totalAssignments,
        xp: 200,
    },
];

export function AchievementsSection() {
    const [data, setData] = useState<AchievementData>({
        completedAssignments: 0,
        totalAssignments: 0,
        kuralVisited: false,
        yorumVisited: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/assignments")
            .then(r => r.json())
            .then(responseData => {
                const assignments = Array.isArray(responseData)
                    ? responseData
                    : (responseData.assignments || []);
                const kuralVisited = Array.isArray(responseData)
                    ? false
                    : !!responseData.kuralVisited;
                const yorumVisited = Array.isArray(responseData)
                    ? false
                    : !!responseData.yorumVisited;

                setData({
                    completedAssignments: assignments.filter((a: { isCompleted: boolean }) => a.isCompleted).length,
                    totalAssignments: assignments.length,
                    kuralVisited,
                    yorumVisited,
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

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                        <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase tracking-wide">Başarılar</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">{earned.length}/{ACHIEVEMENTS.length} rozet kazanıldı</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-amber-500">{totalXP} XP</div>
                    <div className="text-[10px] text-zinc-400 font-medium">/ {maxXP} XP</div>
                </div>
            </div>

            {/* XP Bar */}
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Deneyim Puanı</span>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">{xpPercent}%</span>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
            </div>

            {/* Achievements grid */}
            <div className="p-5 pb-8">
                {earned.length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Kazanıldı</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {earned.map(a => (
                                <div
                                    key={a.id}
                                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border ${a.bgColor} ${a.borderColor} text-center transition-all hover:scale-105`}
                                >
                                    <div className={a.color}>{a.icon}</div>
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-wide ${a.color}`}>{a.title}</p>
                                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">{a.description}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${a.bgColor} ${a.color} border ${a.borderColor}`}>
                                        +{a.xp} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {locked.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Kilitli</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {locked.map(a => (
                                <div
                                    key={a.id}
                                    className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center opacity-60"
                                >
                                    <Lock className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wide text-zinc-500">{a.title}</p>
                                        <p className="text-[9px] text-zinc-400 mt-0.5">{a.description}</p>
                                    </div>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-400">
                                        +{a.xp} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
