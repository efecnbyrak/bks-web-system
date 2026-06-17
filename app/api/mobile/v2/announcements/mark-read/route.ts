import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    const auth = await verifyMobileToken(req);
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
