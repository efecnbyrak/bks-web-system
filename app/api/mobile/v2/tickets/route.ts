import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAdminTicketNotification } from "@/lib/email";
import { getSetting } from "@/lib/settings-cache";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const tickets = await db.supportTicket.findMany({
            where: { userId: auth.userId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("[mobile/v2/tickets] GET error:", error);
        return NextResponse.json({ error: "Talepler yüklenirken hata oluştu." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { errorType, type, subject, description, imageUrls } = body;

    if (!subject || !description) {
        return NextResponse.json({ error: "Konu ve açıklama zorunludur." }, { status: 400 });
    }

    const ticketType = type === "ONERI" ? "ONERI" : "DESTEK";

    if (ticketType === "DESTEK" && !errorType) {
        return NextResponse.json({ error: "Hata kategorisi seçiniz." }, { status: 400 });
    }

    if (subject.length > 200) {
        return NextResponse.json({ error: "Konu başlığı 200 karakteri geçemez." }, { status: 400 });
    }

    let imageUrlsJson: string | null = null;
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        if (imageUrls.length > 5) {
            return NextResponse.json({ error: "En fazla 5 görsel yükleyebilirsiniz." }, { status: 400 });
        }
        imageUrlsJson = JSON.stringify(imageUrls);
    }

    try {
        const [ticket, user, adminEmail] = await Promise.all([
            db.supportTicket.create({
                data: {
                    userId: auth.userId,
                    type: ticketType,
                    errorType: errorType ?? (ticketType === "ONERI" ? "GENEL" : "DIGER"),
                    subject,
                    description,
                    imageUrls: imageUrlsJson,
                },
            }),
            db.user.findUnique({
                where: { id: auth.userId },
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
            }).catch((err) => console.error("[mobile/v2/tickets] Mail gönderilemedi:", err));
        }

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (error) {
        console.error("[mobile/v2/tickets] POST error:", error);
        return NextResponse.json({ error: "Talep oluşturulurken hata oluştu." }, { status: 500 });
    }
}
