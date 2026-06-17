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

export async function POST(req: NextRequest) {
    const auth = await verifyToken(req);
    if (!auth) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const announcementId = parseInt(body.announcementId, 10);
        if (!announcementId || isNaN(announcementId)) {
            return NextResponse.json({ success: false, error: "Missing announcementId" }, { status: 400 });
        }

        await db.announcementRead.create({
            data: {
                userId: auth.userId,
                announcementId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        if (e.code === "P2002") {
            return NextResponse.json({ success: true });
        }
        console.error("[mobile/v2/announcements/mark-read] POST error:", e);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}
