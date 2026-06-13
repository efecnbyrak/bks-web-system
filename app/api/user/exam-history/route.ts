import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const whereClause = user.referee
            ? { refereeId: user.referee.id }
            : user.official
            ? { officialId: user.official.id }
            : null;

        if (!whereClause) return NextResponse.json({ attempts: [] });

        const attempts = await db.examAttempt.findMany({
            where: whereClause,
            select: {
                id: true,
                score: true,
                totalQuestions: true,
                difficulty: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ attempts });
    } catch (error) {
        console.error("Exam History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
