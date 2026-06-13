import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
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

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const examAttempts = user.referee?.examAttempts ?? user.official?.examAttempts ?? [];

        // Profile completeness
        const profile = user.referee ?? user.official;
        const isProfileComplete = !!(
            profile?.firstName &&
            profile?.lastName &&
            profile?.email &&
            profile?.phone &&
            profile?.imageUrl
        );

        // Rule/Yorum progress counts
        const ruleProgressKuralCount = user.ruleProgress.filter((p) => p.type === "kural").length;
        const ruleProgressYorumCount = user.ruleProgress.filter((p) => p.type === "yorum").length;

        // Total article counts from DB
        const [totalKuralCount, totalYorumCount, totalVideoCount] = await Promise.all([
            db.ruleProgress.groupBy({ by: ["articleId"], where: { type: "kural" } }).then((r) => r.length),
            db.ruleProgress.groupBy({ by: ["articleId"], where: { type: "yorum" } }).then((r) => r.length),
            db.video.count(),
        ]);

        // Video progress
        const videoWatchedCount = user.videoProgress.length;
        const allVideosWatched = totalVideoCount > 0 && videoWatchedCount >= totalVideoCount;

        // Exam stats
        const highScoreExams = examAttempts.filter((a) => a.score / a.totalQuestions >= 0.8).length;
        const veryHighScoreExams = examAttempts.filter((a) => a.score / a.totalQuestions >= 0.9).length;
        const perfectExams = examAttempts.filter((a) => a.score === a.totalQuestions).length;
        const hardExamCount = examAttempts.filter((a) => a.difficulty === "Zor").length;

        const totalQuestionsAnswered = examAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);

        const avgScore =
            examAttempts.length > 0
                ? examAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / examAttempts.length
                : 0;

        // Max consecutive correct across all exams
        let consecutiveCorrect = 0;
        for (const attempt of examAttempts) {
            let streak = 0;
            let maxStreak = 0;
            for (const ans of attempt.answers) {
                if (ans.isCorrect) {
                    streak++;
                    maxStreak = Math.max(maxStreak, streak);
                } else {
                    streak = 0;
                }
            }
            consecutiveCorrect = Math.max(consecutiveCorrect, maxStreak);
        }

        // Assignment stats
        const userGroups = ["ALL"];
        if (user.referee) {
            userGroups.push("REFEREE");
            if (user.referee.classification) userGroups.push(user.referee.classification);
        }
        if (user.official) {
            userGroups.push("OFFICIAL");
            userGroups.push(user.official.officialType);
        }

        const allAssignments = await db.examAssignment.findMany({
            where: { isActive: true, OR: userGroups.map((g) => ({ targetGroups: { contains: g } })) },
            select: { id: true },
        });

        const attemptIds = examAttempts.map((a) => a.id);
        const completedAssignments = Math.min(attemptIds.length, allAssignments.length);
        const totalAssignments = allAssignments.length;

        // Serialize exam attempts (no answers needed client-side)
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
        console.error("Achievement data error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
