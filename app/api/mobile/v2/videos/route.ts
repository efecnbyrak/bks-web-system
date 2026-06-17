import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

async function verifyToken(req: NextRequest): Promise<{ userId: number; role: string } | null> {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return null;
    try {
        const hash = createHash("sha256").update(token).digest("hex");
        const user = await db.user.findFirst({
            where: { mobileToken: hash, mobileTokenExpiry: { gt: new Date() } },
            include: { role: true },
        });
        if (!user) return null;
        return { userId: user.id, role: user.role.name };
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const auth = await verifyToken(req);
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
