import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ticketIds } = body as { ticketIds: number[] };

        if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
            return NextResponse.json({ error: "ticketIds gerekli." }, { status: 400 });
        }

        await db.supportTicket.updateMany({
            where: {
                id: { in: ticketIds },
                userId: session.userId, // Sadece kendi ticket'larını işaretleyebilir
            },
            data: { replySeenAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/tickets/mark-reply-seen error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
