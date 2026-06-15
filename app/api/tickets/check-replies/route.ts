import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const tickets = await db.supportTicket.findMany({
            where: {
                userId: session.userId,
                adminNote: { not: null },
                status: { in: ["IN_PROGRESS", "CLOSED"] },
                updatedAt: { gte: thirtyDaysAgo },
                replySeenAt: null, // Sadece kullanıcının henüz görmediği cevapları döndür
            },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                subject: true,
                adminNote: true,
                status: true,
                type: true,
                updatedAt: true,
            },
        });

        // adminNote boş string olmayanlar
        const withReplies = tickets.filter(
            (t) => t.adminNote && t.adminNote.trim().length > 0
        );

        return NextResponse.json({
            hasNewReply: withReplies.length > 0,
            tickets: withReplies,
        });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
