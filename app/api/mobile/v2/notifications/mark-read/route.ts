import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let body: { type: string; refId: number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { type, refId } = body;

    if (type !== "TICKET_REPLY" || !refId) {
        return NextResponse.json({ error: "Geçersiz bildirim tipi." }, { status: 400 });
    }

    try {
        const ticket = await db.supportTicket.findFirst({
            where: { id: refId, userId: auth.userId },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
        }

        await db.supportTicket.update({
            where: { id: refId },
            data: { replySeenAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[mobile/v2/notifications/mark-read] POST error:", e);
        return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
    }
}
