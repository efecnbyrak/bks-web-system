import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: auth.userId },
            include: { referee: true, official: true },
        });

        if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

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
        console.error("[mobile/v2/exam-results] GET error:", error);
        return NextResponse.json({ error: "Sınav geçmişi yüklenirken hata oluştu." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { score, totalQuestions, difficulty, category } = body;

    if (typeof score !== "number" || typeof totalQuestions !== "number") {
        return NextResponse.json({ error: "Geçersiz sınav verisi." }, { status: 400 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: auth.userId },
            include: { referee: true, official: true },
        });

        if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

        const refereeId = user.referee?.id ?? null;
        const officialId = user.official?.id ?? null;

        if (!refereeId && !officialId) {
            return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
        }

        const attempt = await db.examAttempt.create({
            data: {
                refereeId,
                officialId,
                score,
                totalQuestions,
                difficulty: difficulty ?? "Orta",
            },
        });

        return NextResponse.json({ attempt }, { status: 201 });
    } catch (error) {
        console.error("[mobile/v2/exam-results] POST error:", error);
        return NextResponse.json({ error: "Sınav sonucu kaydedilemedi." }, { status: 500 });
    }
}
