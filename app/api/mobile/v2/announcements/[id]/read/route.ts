import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v2/announcements/{id}/read
 * Duyuruyu okundu olarak işaretler (path param versiyonu).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcementId = parseInt(id, 10);
    if (isNaN(announcementId)) {
        return NextResponse.json({ success: false, error: "Geçersiz duyuru ID." }, { status: 400 });
    }

    try {
        await db.announcementRead.create({
            data: {
                userId: auth.userId,
                announcementId,
            },
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        if (e.code === "P2002") {
            // Zaten okunmuş — idempotent
            return NextResponse.json({ success: true });
        }
        console.error("[mobile/v2/announcements/[id]/read] POST error:", e);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}
