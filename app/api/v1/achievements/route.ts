import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

/**
 * GET /api/v1/achievements
 * Mobile token ile kullanıcının başarım verilerini döndürür.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: auth.userId },
            include: {
                referee: {
                    include: {
                        examAttempts: {
                            include: { answers: { select: { isCorrect: true } } },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
                official: {
                    include: {
                        examAttempts: {
                            include: { answers: { select: { isCorrect: true } } },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
                sectionVisits: { select: { section: true } },
                ruleProgress: { select: { type: true } },
                videoProgress: { where: { watched: true }, select: { videoId: true } },
            },
        });

        if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

        const examAttempts = user.referee?.examAttempts ?? user.official?.examAttempts ?? [];
        const profile = user.referee ?? user.official;
        const isProfileComplete = !!(
            profile?.firstName &&
            profile?.lastName &&
            profile?.email &&
            profile?.phone &&
            profile?.imageUrl
        );

        const ruleProgressKuralCount = user.ruleProgress.filter((p) => p.type === "kural").length;
        const ruleProgressYorumCount = user.ruleProgress.filter((p) => p.type === "yorum").length;

        const [totalKuralCount, totalYorumCount, totalVideoCount] = await Promise.all([
            db.ruleProgress.groupBy({ by: ["articleId"], where: { type: "kural" } }).then((r) => r.length),
            db.ruleProgress.groupBy({ by: ["articleId"], where: { type: "yorum" } }).then((r) => r.length),
            db.video.count(),
        ]);

        const videoWatchedCount = user.videoProgress.length;
        const allVideosWatched = totalVideoCount > 0 && videoWatchedCount >= totalVideoCount;

        const highScoreExams = examAttempts.filter((a) => a.score / a.totalQuestions >= 0.8).length;
        const veryHighScoreExams = examAttempts.filter((a) => a.score / a.totalQuestions >= 0.9).length;
        const perfectExams = examAttempts.filter((a) => a.score === a.totalQuestions).length;
        const hardExamCount = examAttempts.filter((a) => a.difficulty === "Zor").length;
        const totalQuestionsAnswered = examAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const avgScore =
            examAttempts.length > 0
                ? examAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / examAttempts.length
                : 0;

        let consecutiveCorrect = 0;
        for (const attempt of examAttempts) {
            let streak = 0;
            let maxStreak = 0;
            for (const ans of attempt.answers) {
                if (ans.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); }
                else { streak = 0; }
            }
            consecutiveCorrect = Math.max(consecutiveCorrect, maxStreak);
        }

        const userGroups = ["ALL"];
        if (user.referee) {
            userGroups.push("REFEREE");
            if (user.referee.classification) userGroups.push(user.referee.classification);
        }
        if (user.official) {
            userGroups.push("OFFICIAL");
            userGroups.push((user.official as any).officialType);
        }

        const allAssignments = await db.examAssignment.findMany({
            where: { isActive: true, OR: userGroups.map((g) => ({ targetGroups: { contains: g } })) },
            select: { id: true },
        });

        const completedAssignments = Math.min(examAttempts.length, allAssignments.length);
        const totalAssignments = allAssignments.length;

        const serializedAttempts = examAttempts.map((a) => ({
            id: a.id,
            score: a.score,
            totalQuestions: a.totalQuestions,
            difficulty: a.difficulty,
            createdAt: a.createdAt.toISOString(),
        }));

        return NextResponse.json({
            completedAssignments,
            totalAssignments,
            kuralVisited: user.sectionVisits.some((v) => v.section === "kural"),
            yorumVisited: user.sectionVisits.some((v) => v.section === "yorum"),
            examAttempts: serializedAttempts,
            loginCount: user.lastLoginAt ? 1 : 0,
            isProfileComplete,
            videoWatchedCount,
            allVideosWatched,
            ruleProgressKuralCount,
            ruleProgressYorumCount,
            totalKuralCount,
            totalYorumCount,
            consecutiveCorrect,
            highScoreExams,
            veryHighScoreExams,
            perfectExams,
            hardExamCount,
            avgScore,
            totalQuestionsAnswered,
        });
    } catch (error) {
        console.error("[API/V1/ACHIEVEMENTS] Error:", error);
        return NextResponse.json({ error: "Başarım verileri alınamadı." }, { status: 500 });
    }
}
