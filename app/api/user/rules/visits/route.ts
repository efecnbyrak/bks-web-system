import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ kuralVisited: false, yorumVisited: false });
    }

    try {
        const visits = await db.sectionVisit.findMany({
            where: { userId: session.userId },
            select: { section: true },
        });
        return NextResponse.json({
            kuralVisited: visits.some((v) => v.section === "kural"),
            yorumVisited: visits.some((v) => v.section === "yorum"),
        });
    } catch {
        return NextResponse.json({ kuralVisited: false, yorumVisited: false });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const section = body?.section as "kural" | "yorum";
        if (section !== "kural" && section !== "yorum") {
            return NextResponse.json({ error: "Invalid section" }, { status: 400 });
        }

        await db.sectionVisit.upsert({
            where: { userId_section: { userId: session.userId, section } },
            create: { userId: session.userId, section },
            update: { visitedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
    }
}
