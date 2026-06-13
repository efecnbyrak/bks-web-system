"use server";

import { db } from "@/lib/db";

export interface UserAchievementData {
    id: number;
    userId: number;
    type: "referee" | "official";
    firstName: string;
    lastName: string;
    email: string;
    category: string; // classification or officialType
    examAttempts: {
        id: number;
        score: number;
        totalQuestions: number;
        difficulty: string | null;
        createdAt: Date;
    }[];
    ruleProgressCount: number;
    yorumProgressCount: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    completedAssignments: number;
    totalAssignments: number;
    xp: number;
    level: string;
    earnedAchievements: string[];
}

function computeXPAndLevel(data: {
    completedAssignments: number;
    totalAssignments: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    examAttempts: { score: number; totalQuestions: number; difficulty: string | null }[];
}): { xp: number; level: string; earnedAchievements: string[] } {
    const earned: string[] = [];
    let xp = 0;

    if (data.completedAssignments >= 1) { earned.push("İlk Adım"); xp += 50; }
    if (data.completedAssignments >= 5) { earned.push("Çalışkan Hakem"); xp += 150; }
    if (data.completedAssignments >= 10) { earned.push("Kural Ustası"); xp += 300; }
    if (data.totalAssignments > 0 && data.completedAssignments === data.totalAssignments) {
        earned.push("Eksiksiz Hakem"); xp += 200;
    }
    if (data.kuralVisited) { earned.push("Kural Okuyucu"); xp += 30; }
    if (data.yorumVisited) { earned.push("Yorum Takipçisi"); xp += 30; }
    if (data.examAttempts.length >= 1) { earned.push("Sınav Başlangıcı"); xp += 50; }
    if (data.examAttempts.some(a => (a.score / a.totalQuestions) >= 0.8)) {
        earned.push("Başarılı Hakem"); xp += 100;
    }
    if (data.examAttempts.length >= 3) { earned.push("Denemeci"); xp += 150; }
    if (data.examAttempts.some(a => a.difficulty === "Zor")) {
        earned.push("Zorlu Yolu Seçen"); xp += 200;
    }

    const LEVELS = [
        { name: "Bronz", minXP: 0 },
        { name: "Gümüş", minXP: 100 },
        { name: "Altın", minXP: 300 },
        { name: "Platin", minXP: 760 },
        { name: "Elmas", minXP: 1060 },
    ];

    let level = "Bronz";
    for (const l of LEVELS) {
        if (xp >= l.minXP) level = l.name;
    }

    return { xp, level, earnedAchievements: earned };
}

export async function getAllUsersAchievements(): Promise<{ success: boolean; data?: UserAchievementData[]; error?: string }> {
    try {
        const [referees, officials] = await Promise.all([
            db.referee.findMany({
                select: {
                    id: true,
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    classification: true,
                    examAttempts: {
                        select: {
                            id: true,
                            score: true,
                            totalQuestions: true,
                            difficulty: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: "desc" },
                    },
                    user: {
                        select: {
                            sectionVisits: { select: { section: true } },
                            ruleProgress: { select: { type: true } },
                        },
                    },
                },
            }),
            db.generalOfficial.findMany({
                select: {
                    id: true,
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    officialType: true,
                    examAttempts: {
                        select: {
                            id: true,
                            score: true,
                            totalQuestions: true,
                            difficulty: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: "desc" },
                    },
                    user: {
                        select: {
                            sectionVisits: { select: { section: true } },
                            ruleProgress: { select: { type: true } },
                        },
                    },
                },
            }),
        ]);

        // ExamAssignment tamamlanma sayısı için ayrı sorgu — assignment'lar userId üzerinden değil refereeId/officialId üzerinden
        // Tüm assignment'ları çekip attempt sayısıyla karşılaştıracağız
        const allAssignments = await db.examAssignment.findMany({
            select: {
                id: true,
                targetGroups: true,
                targetCategories: true,
                isActive: true,
            },
        });

        function getAssignmentStats(
            userType: "referee" | "official",
            category: string,
            attemptIds: number[],
        ) {
            const relevant = allAssignments.filter(a => {
                const tg = a.targetGroups;
                if (tg === "ALL") return true;
                if (userType === "referee" && tg === "REFEREE") return true;
                if (userType === "official" && tg === "OFFICIAL") return true;
                if (userType === "referee" && tg === category) return true;
                return false;
            });
            return { total: relevant.length, completed: Math.min(attemptIds.length, relevant.length) };
        }

        const result: UserAchievementData[] = [];

        for (const r of referees) {
            const kuralVisited = r.user.sectionVisits.some(v => v.section === "kural");
            const yorumVisited = r.user.sectionVisits.some(v => v.section === "yorum");
            const ruleProgressCount = r.user.ruleProgress.filter(p => p.type === "kural").length;
            const yorumProgressCount = r.user.ruleProgress.filter(p => p.type === "yorum").length;
            const { total, completed } = getAssignmentStats("referee", r.classification, r.examAttempts.map(a => a.id));
            const { xp, level, earnedAchievements } = computeXPAndLevel({
                completedAssignments: completed,
                totalAssignments: total,
                kuralVisited,
                yorumVisited,
                examAttempts: r.examAttempts,
            });

            result.push({
                id: r.id,
                userId: r.userId,
                type: "referee",
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email,
                category: r.classification,
                examAttempts: r.examAttempts,
                ruleProgressCount,
                yorumProgressCount,
                kuralVisited,
                yorumVisited,
                completedAssignments: completed,
                totalAssignments: total,
                xp,
                level,
                earnedAchievements,
            });
        }

        for (const o of officials) {
            const kuralVisited = o.user.sectionVisits.some(v => v.section === "kural");
            const yorumVisited = o.user.sectionVisits.some(v => v.section === "yorum");
            const ruleProgressCount = o.user.ruleProgress.filter(p => p.type === "kural").length;
            const yorumProgressCount = o.user.ruleProgress.filter(p => p.type === "yorum").length;
            const { total, completed } = getAssignmentStats("official", o.officialType, o.examAttempts.map(a => a.id));
            const { xp, level, earnedAchievements } = computeXPAndLevel({
                completedAssignments: completed,
                totalAssignments: total,
                kuralVisited,
                yorumVisited,
                examAttempts: o.examAttempts,
            });

            result.push({
                id: o.id,
                userId: o.userId,
                type: "official",
                firstName: o.firstName,
                lastName: o.lastName,
                email: o.email,
                category: o.officialType,
                examAttempts: o.examAttempts,
                ruleProgressCount,
                yorumProgressCount,
                kuralVisited,
                yorumVisited,
                completedAssignments: completed,
                totalAssignments: total,
                xp,
                level,
                earnedAchievements,
            });
        }

        result.sort((a, b) => b.xp - a.xp);

        return { success: true, data: result };
    } catch (error: unknown) {
        console.error("Error fetching achievements:", error);
        return { success: false, error: "Başarılar yüklenirken bir hata oluştu." };
    }
}
