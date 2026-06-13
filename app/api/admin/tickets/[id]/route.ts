import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await verifySession();
        if (!session.userId || !["SUPER_ADMIN", "ADMIN", "ADMIN_IHK"].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);
        if (isNaN(ticketId)) return NextResponse.json({ error: "Geçersiz ID." }, { status: 400 });

        const body = await req.json();
        const { status, adminNote } = body;

        const validStatuses = ["OPEN", "IN_PROGRESS", "CLOSED"];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
        }

        const ticket = await db.supportTicket.update({
            where: { id: ticketId },
            data: {
                ...(status ? { status } : {}),
                ...(adminNote !== undefined ? { adminNote } : {}),
            },
        });

        return NextResponse.json({ ticket });
    } catch (error) {
        console.error("PUT /api/admin/tickets/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await verifySession();
        if (!session.userId || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const ticketId = parseInt(id);
        if (isNaN(ticketId)) return NextResponse.json({ error: "Geçersiz ID." }, { status: 400 });

        await db.supportTicket.delete({ where: { id: ticketId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/tickets/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
