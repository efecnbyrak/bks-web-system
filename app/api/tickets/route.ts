import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { sendAdminTicketNotification } from "@/lib/email";
import { getSetting } from "@/lib/settings-cache";

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
        const { errorType, type, subject, description, imageUrls } = body;

        const ticketType = type === "ONERI" ? "ONERI" : "DESTEK";

        if (!subject || !description) {
            return NextResponse.json({ error: "Konu ve açıklama zorunludur." }, { status: 400 });
        }

        // Destek için errorType zorunlu, Öneri için değil
        if (ticketType === "DESTEK" && !errorType) {
            return NextResponse.json({ error: "Hata kategorisi seçiniz." }, { status: 400 });
        }

        if (subject.length > 200) {
            return NextResponse.json({ error: "Konu başlığı 200 karakteri geçemez." }, { status: 400 });
        }

        // imageUrls: string[] → JSON string olarak sakla
        let imageUrlsJson: string | null = null;
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            if (imageUrls.length > 5) {
                return NextResponse.json({ error: "En fazla 5 görsel yükleyebilirsiniz." }, { status: 400 });
            }
            imageUrlsJson = JSON.stringify(imageUrls);
        }

        const [ticket, user, adminEmail] = await Promise.all([
            db.supportTicket.create({
                data: {
                    userId: session.userId,
                    type: ticketType,
                    errorType: errorType ?? (ticketType === "ONERI" ? "GENEL" : "DIGER"),
                    subject,
                    description,
                    imageUrls: imageUrlsJson,
                },
            }),
            db.user.findUnique({
                where: { id: session.userId },
                select: {
                    username: true,
                    referee: { select: { firstName: true, lastName: true, email: true } },
                    official: { select: { firstName: true, lastName: true, email: true } },
                },
            }),
            getSetting("ADMIN_NOTIFICATION_EMAIL"),
        ]);

        if (adminEmail) {
            const profile = user?.referee ?? user?.official;
            const displayName = profile
                ? `${profile.firstName} ${profile.lastName}`
                : (user?.username ?? undefined);
            sendAdminTicketNotification(adminEmail, {
                id: ticket.id,
                type: ticket.type,
                errorType: ticket.errorType,
                subject: ticket.subject,
                description: ticket.description,
                imageUrls: ticket.imageUrls ? JSON.parse(ticket.imageUrls) : null,
                createdAt: ticket.createdAt,
                userName: displayName,
                userEmail: profile?.email ?? undefined,
            }).catch(err => console.error("[TICKET NOTIFY] Mail gönderilemedi:", err));
        }

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (error) {
        console.error("POST /api/tickets error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
