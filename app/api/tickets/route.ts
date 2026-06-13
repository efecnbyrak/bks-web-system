import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tickets = await db.supportTicket.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("GET /api/tickets error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { errorType, subject, description, imageUrl } = body;

        if (!errorType || !subject || !description) {
            return NextResponse.json({ error: "Eksik alanlar var." }, { status: 400 });
        }

        if (subject.length > 200) {
            return NextResponse.json({ error: "Konu başlığı çok uzun." }, { status: 400 });
        }

        const ticket = await db.supportTicket.create({
            data: {
                userId: session.userId,
                errorType,
                subject,
                description,
                imageUrl: imageUrl ?? null,
            },
        });

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (error) {
        console.error("POST /api/tickets error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
