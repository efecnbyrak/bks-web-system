import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const videos = await db.video.findMany({
            include: { videoCategory: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ videos });
    } catch (error) {
        console.error("[mobile/v2/videos] GET error:", error);
        return NextResponse.json({ error: "Video listesi yüklenirken hata oluştu." }, { status: 500 });
    }
}
