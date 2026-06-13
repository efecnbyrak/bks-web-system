"use server";

import { db } from "@/lib/db";
import { RANK_LEVELS, UserAchievementData } from "./achievement-types";

function computeXPAndRank(data: {
    completedAssignments: number;
    totalAssignments: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    examAttempts: { score: number; totalQuestions: number; difficulty: string | null }[];
    videoWatchedCount: number;
    totalVideoCount: number;
    ruleProgressKuralCount: number;
    ruleProgressYorumCount: number;
    totalKuralCount: number;
    totalYorumCount: number;
    isProfileComplete: boolean;
    loginCount: number;
}): { xp: number; rank: string; earnedAchievements: string[] } {
    const earned: string[] = [];
    let xp = 0;

    const add = (name: string, points: number) => { earned.push(name); xp += points; };

    // Görev rozetleri
    if (data.completedAssignments >= 1) add("İlk Adım", 50);
    if (data.completedAssignments >= 5) add("Çalışkan Hakem", 150);
    if (data.completedAssignments >= 10) add("Kural Ustası", 300);
    if (data.completedAssignments >= 20) add("Kural Ustası Pro", 500);
    if (data.completedAssignments >= 40) add("İnsanüstü Hakem", 1000);
    if (data.totalAssignments > 0 && data.completedAssignments === data.totalAssignments) add("Eksiksiz Hakem", 200);

    // Kural kitabı rozetleri
    if (data.ruleProgressKuralCount >= 5) add("İlk 5 Kural", 30);
    if (data.yorumVisited) add("Yorum Takipçisi", 30);

    const kuralPct = data.totalKuralCount > 0 ? data.ruleProgressKuralCount / data.totalKuralCount : 0;
    const yorumPct = data.totalYorumCount > 0 ? data.ruleProgressYorumCount / data.totalYorumCount : 0;

    if (yorumPct >= 0.25) add("Yorum Okuyucu", 70);

    // Video rozetleri
    if (data.videoWatchedCount >= 5) add("Video İzleyici", 120);
    if (data.totalVideoCount > 0 && data.videoWatchedCount >= data.totalVideoCount) add("Video Ustası", 300);

    // Profil
    if (data.loginCount >= 1) add("Meraklı Hakem", 20);
    if (data.isProfileComplete) add("Profil Oluşturucu", 20);

    // Sınav rozetleri
    const attempts = data.examAttempts;
    const examCount = attempts.length;
    const perfectExams = attempts.filter((a) => a.score === a.totalQuestions).length;
    const hardExamCount = attempts.filter((a) => a.difficulty === "Zor").length;
    const highScoreExams = attempts.filter((a) => a.score / a.totalQuestions >= 0.8).length;
    const veryHighScoreExams = attempts.filter((a) => a.score / a.totalQuestions >= 0.9).length;
    const totalQuestionsAnswered = attempts.reduce((s, a) => s + a.totalQuestions, 0);
    const avgScore = examCount > 0 ? attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / examCount : 0;

    if (examCount >= 1) add("Sınav Başlangıcı", 50);
    if (examCount >= 3) add("Denemeci", 150);
    if (examCount >= 10) add("Elit Hakem", 500);
    if (examCount >= 25) add("Hakem Efsanesi", 1000);

    if (highScoreExams >= 1) add("Başarılı Hakem", 100);
    if (veryHighScoreExams >= 1) add("%90 Kulübü", 400);
    if (perfectExams >= 1) add("Mükemmel Skor", 1000);
    if (perfectExams >= 3) add("Kusursuz Hakem", 2000);

    if (hardExamCount >= 1) add("Zorlu Yolu Seçen", 200);
    if (hardExamCount >= 5) add("Kural Avcısı", 200);
    if (hardExamCount >= 5) add("Turnuva Hazır", 600);

    if (examCount >= 5 && avgScore >= 75) add("Tutarlı Performans", 350);

    if (totalQuestionsAnswered >= 200) add("Soru Çözücü", 120);
    if (totalQuestionsAnswered >= 1000) add("Hakem Refleksi", 300);
    if (totalQuestionsAnswered >= 2000) add("Analizci Hakem", 200);
    if (totalQuestionsAnswered >= 5000) add("Efsanevi Öğrenci", 2000);

    // Final rozetler (kombinasyon)
    if (hardExamCount >= 1 && perfectExams >= 1) add("Final Boss", 2000);

    // Normal rozet sayısı (legend öncesi) — BKS Şampiyonu buraya göre hesaplanır
    const normalBadgeCount = 35;
    if (earned.length >= Math.ceil(normalBadgeCount * 0.8)) add("BKS Şampiyonu", 2500);

    if (kuralPct >= 1.0 && data.totalVideoCount > 0 && data.videoWatchedCount >= data.totalVideoCount && examCount >= 10) {
        add("Sistemin Efendisi", 3000);
        add("Ultimate Master", 4000);
    }

    const allCount = normalBadgeCount + 3; // +BKS Şampiyonu, Sistemin Efendisi, Ultimate Master
    if (earned.length >= allCount) add("BKS LEGEND", 0);

    // Rank hesaplama
    let rank = "Başlangıç";
    for (const r of RANK_LEVELS) {
        if (xp >= r.minXP) rank = r.name;
    }

    return { xp, rank, earnedAchievements: earned };
}

export async function getAllUsersAchievements(): Promise<{ success: boolean; data?: UserAchievementData[]; error?: string }> {
    try {
        const [referees, officials, totalVideoCount] = await Promise.all([
            db.referee.findMany({
                select: {
                    id: true,
                    userId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    classification: true,
                    imageUrl: true,
                    phone: true,
                    examAttempts: {
                        select: { id: true, score: true, totalQuestions: true, difficulty: true, createdAt: true },
                        orderBy: { createdAt: "desc" },
                    },
                    user: {
                        select: {
                            sectionVisits: { select: { section: true } },
                            ruleProgress: { select: { type: true } },
                            videoProgress: { where: { watched: true }, select: { videoId: true } },
                            lastLoginAt: true,
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
                    imageUrl: true,
                    phone: true,
                    examAttempts: {
                        select: { id: true, score: true, totalQuestions: true, difficulty: true, createdAt: true },
                        orderBy: { createdAt: "desc" },
                    },
                    user: {
                        select: {
                            sectionVisits: { select: { section: true } },
                            ruleProgress: { select: { type: true } },
                            videoProgress: { where: { watched: true }, select: { videoId: true } },
                            lastLoginAt: true,
                        },
                    },
                },
            }),
            db.video.count(),
        ]);

        const [totalKuralArticles, totalYorumArticles] = await Promise.all([
            db.ruleProgress.findMany({ distinct: ["articleId"], where: { type: "kural" }, select: { articleId: true } }).then((r) => Math.max(r.length, 1)),
            db.ruleProgress.findMany({ distinct: ["articleId"], where: { type: "yorum" }, select: { articleId: true } }).then((r) => Math.max(r.length, 1)),
        ]);

        const allAssignments = await db.examAssignment.findMany({
            select: { id: true, targetGroups: true, targetCategories: true, isActive: true },
        });

        function getAssignmentStats(userType: "referee" | "official", category: string, attemptIds: number[]) {
            const relevant = allAssignments.filter((a) => {
                const tg = a.targetGroups;
                if (tg === "ALL") return true;
                if (userType === "referee" && tg === "REFEREE") return true;
                if (userType === "official" && tg === "OFFICIAL") return true;
                if (tg === category) return true;
                return false;
            });
            return { total: relevant.length, completed: Math.min(attemptIds.length, relevant.length) };
        }

        const result: UserAchievementData[] = [];

        for (const r of referees) {
            const kuralVisited = r.user.sectionVisits.some((v) => v.section === "kural");
            const yorumVisited = r.user.sectionVisits.some((v) => v.section === "yorum");
            const ruleProgressCount = r.user.ruleProgress.filter((p) => p.type === "kural").length;
            const yorumProgressCount = r.user.ruleProgress.filter((p) => p.type === "yorum").length;
            const videoWatchedCount = r.user.videoProgress.length;
            const { total, completed } = getAssignmentStats("referee", r.classification, r.examAttempts.map((a) => a.id));

            const { xp, rank, earnedAchievements } = computeXPAndRank({
                completedAssignments: completed,
                totalAssignments: total,
                kuralVisited,
                yorumVisited,
                examAttempts: r.examAttempts,
                videoWatchedCount,
                totalVideoCount,
                ruleProgressKuralCount: ruleProgressCount,
                ruleProgressYorumCount: yorumProgressCount,
                totalKuralCount: totalKuralArticles,
                totalYorumCount: totalYorumArticles,
                isProfileComplete: !!(r.firstName && r.lastName && r.email && r.phone && r.imageUrl),
                loginCount: r.user.lastLoginAt ? 1 : 0,
            });

            result.push({
                id: r.id, userId: r.userId, type: "referee",
                firstName: r.firstName, lastName: r.lastName, email: r.email,
                category: r.classification, examAttempts: r.examAttempts,
                ruleProgressCount, yorumProgressCount, kuralVisited, yorumVisited,
                completedAssignments: completed, totalAssignments: total,
                videoWatchedCount, totalVideoCount,
                xp, rank, earnedAchievements,
            });
        }

        for (const o of officials) {
            const kuralVisited = o.user.sectionVisits.some((v) => v.section === "kural");
            const yorumVisited = o.user.sectionVisits.some((v) => v.section === "yorum");
            const ruleProgressCount = o.user.ruleProgress.filter((p) => p.type === "kural").length;
            const yorumProgressCount = o.user.ruleProgress.filter((p) => p.type === "yorum").length;
            const videoWatchedCount = o.user.videoProgress.length;
            const { total, completed } = getAssignmentStats("official", o.officialType, o.examAttempts.map((a) => a.id));

            const { xp, rank, earnedAchievements } = computeXPAndRank({
                completedAssignments: completed,
                totalAssignments: total,
                kuralVisited,
                yorumVisited,
                examAttempts: o.examAttempts,
                videoWatchedCount,
                totalVideoCount,
                ruleProgressKuralCount: ruleProgressCount,
                ruleProgressYorumCount: yorumProgressCount,
                totalKuralCount: totalKuralArticles,
                totalYorumCount: totalYorumArticles,
                isProfileComplete: !!(o.firstName && o.lastName && o.email && o.phone && o.imageUrl),
                loginCount: o.user.lastLoginAt ? 1 : 0,
            });

            result.push({
                id: o.id, userId: o.userId, type: "official",
                firstName: o.firstName, lastName: o.lastName, email: o.email,
                category: o.officialType, examAttempts: o.examAttempts,
                ruleProgressCount, yorumProgressCount, kuralVisited, yorumVisited,
                completedAssignments: completed, totalAssignments: total,
                videoWatchedCount, totalVideoCount,
                xp, rank, earnedAchievements,
            });
        }

        result.sort((a, b) => b.xp - a.xp);
        return { success: true, data: result };
    } catch (error: unknown) {
        console.error("Error fetching achievements:", error);
        return { success: false, error: "Başarılar yüklenirken bir hata oluştu." };
    }
}

export async function resetAllAchievements(): Promise<{ success: boolean; error?: string }> {
    try {
        await db.$transaction([
            db.examAttempt.deleteMany({}),
            db.videoProgress.deleteMany({}),
            db.ruleProgress.deleteMany({}),
        ]);
        return { success: true };
    } catch (error: unknown) {
        console.error("Error resetting achievements:", error);
        return { success: false, error: "Sıfırlama sırasında bir hata oluştu." };
    }
}
