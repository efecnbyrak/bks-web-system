import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

/**
 * POST /api/v1/videos/{id}/progress
 * Video izleme ilerlemesini kaydeder.
 * Body: { position: number, watched: boolean }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id } = await params;
    const videoId = parseInt(id, 10);
    if (isNaN(videoId)) {
        return NextResponse.json({ error: "Geçersiz video ID." }, { status: 400 });
    }

    try {
        const body = await request.json();
        const position = typeof body.position === "number" ? Math.max(0, body.position) : 0;
        const watched = body.watched === true;

        await db.videoProgress.upsert({
            where: { userId_videoId: { userId: auth.userId, videoId } },
            create: { userId: auth.userId, videoId, lastPosition: position, watched },
            update: { lastPosition: position, watched },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API/V1/VIDEOS/PROGRESS] Error:", error);
        return NextResponse.json({ error: "İlerleme kaydedilemedi." }, { status: 500 });
    }
}
