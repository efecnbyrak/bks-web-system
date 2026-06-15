import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
    OPEN: "Beklemede",
    IN_PROGRESS: "İnceleniyor",
    CLOSED: "Kapatıldı",
};

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

        // Mevcut ticket'ı al — adminNote değişti mi karşılaştırmak için
        const existingTicket = await db.supportTicket.findUnique({
            where: { id: ticketId },
            select: { adminNote: true, subject: true, userId: true, status: true },
        });

        const ticket = await db.supportTicket.update({
            where: { id: ticketId },
            data: {
                ...(status ? { status } : {}),
                ...(adminNote !== undefined ? { adminNote } : {}),
            },
        });

        // adminNote yeni girildi/değişti ve kullanıcı varsa → Bana Özel duyuru gönder
        const newNote = adminNote !== undefined ? adminNote : existingTicket?.adminNote;
        const noteChanged = adminNote !== undefined && adminNote.trim() && adminNote !== existingTicket?.adminNote;

        if (noteChanged && existingTicket?.userId) {
            const finalStatus = status || existingTicket.status;
            const statusLabel = STATUS_LABEL[finalStatus] ?? finalStatus;
            const ticketSubject = existingTicket.subject ?? "Destek Talebi";

            const notifSubject = `Destek Talebinize Yanıt: ${ticketSubject}`;
            const notifContent = `<p>Destek talebiniz incelendi ve yanıtlandı.</p>
<p><strong>Talep:</strong> ${ticketSubject}</p>
<p><strong>Durum:</strong> ${statusLabel}</p>
<p><strong>Yanıt:</strong></p>
<p>${newNote.trim()}</p>
<p style="color:#71717a;font-size:12px;margin-top:16px;">Bu bildirim destek talebinize verilen resmi yanıttır.</p>`;

            try {
                await db.announcement.create({
                    data: {
                        subject: notifSubject,
                        content: notifContent,
                        target: `SPECIFIC:${existingTicket.userId}`,
                        senderId: session.userId,
                        sentCount: 0,
                    },
                });
            } catch (notifErr) {
                console.error("Ticket reply notification error:", notifErr);
                // Bildirim hatası ticket güncellemeyi engellemesin
            }
        }

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
