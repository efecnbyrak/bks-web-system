// Mobil admin tarafından duyuru gönderme endpoint'i.
// Web'deki sendAnnouncement server action'ının REST karşılığı.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { sendEmailSafe } from "@/lib/email";
import { sendPushNotifications } from "@/lib/push-notifications";
import { logAction } from "@/lib/logger";
import sanitizeHtml from "sanitize-html";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

const DB_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ["b", "i", "em", "strong", "u", "p", "br", "ul", "ol", "li"],
    allowedAttributes: {},
};

export async function POST(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { subject, content, target = "ALL", specificUserIds } = body as {
            subject: string;
            content: string;
            target?: string;
            specificUserIds?: number[];
        };

        if (!subject?.trim() || !content?.trim()) {
            return NextResponse.json({ error: "Konu ve içerik zorunludur." }, { status: 400 });
        }

        // Hedef kullanıcıları ve e-posta adreslerini bul
        let recipients: Array<{ email: string }> = [];
        let savedTarget = target;

        if (specificUserIds && specificUserIds.length > 0) {
            savedTarget = `SPECIFIC:${specificUserIds.join(",")}`;
            const refs = await db.referee.findMany({
                where: { userId: { in: specificUserIds } },
                select: { email: true },
            });
            const offs = await db.generalOfficial.findMany({
                where: { userId: { in: specificUserIds } },
                select: { email: true },
            });
            recipients = [...refs, ...offs].filter((r): r is { email: string } => !!r.email);
        } else if (target === "ALL") {
            recipients = await db.$queryRaw<Array<{ email: string }>>`
                SELECT email FROM (
                    SELECT email FROM referees WHERE email IS NOT NULL
                    UNION ALL
                    SELECT email FROM general_officials WHERE email IS NOT NULL
                ) combined
            `;
        } else {
            // Hakemler veya belirli görevli tipi
            if (target === "REFEREE") {
                const refs = await db.referee.findMany({
                    where: { email: { not: null } },
                    select: { email: true },
                });
                recipients = refs.filter((r): r is { email: string } => !!r.email);
            } else {
                const offs = await db.generalOfficial.findMany({
                    where: { officialType: target, email: { not: null } },
                    select: { email: true },
                });
                recipients = offs.filter((r): r is { email: string } => !!r.email);
            }
        }

        if (recipients.length === 0) {
            return NextResponse.json({ error: "Hedef kitlede kullanıcı bulunamadı." }, { status: 400 });
        }

        // E-posta gönder
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basketbolkoordinasyonsistemi.com.tr";
        const escapeHtml = (s: string) =>
            s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

        const emailResults = await Promise.all(
            recipients.map(async (u) => {
                try {
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:0"><div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7"><div style="background:#ef4444;padding:30px 20px;text-align:center;color:white;font-weight:900;font-size:28px">BKS</div><div style="padding:32px"><h1 style="color:#ef4444;font-size:20px;margin-bottom:16px">${escapeHtml(subject)}</h1><div style="color:#3f3f46;white-space:pre-wrap;line-height:1.6">${escapeHtml(content)}</div><a href="${appUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Sisteme Giriş Yap</a></div><div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#a1a1aa">Bu otomatik bir sistem e-postasıdır. Lütfen yanıtlamayınız.</div></div></body></html>`;
                    await sendEmailSafe(u.email, subject, html);
                    return true;
                } catch {
                    return false;
                }
            })
        );
        const successCount = emailResults.filter(Boolean).length;

        // DB'ye kaydet (sanitize edilmiş haliyle)
        const sanitizedSubject = sanitizeHtml(subject, { allowedTags: [], allowedAttributes: {} });
        const sanitizedContent = sanitizeHtml(content, DB_SANITIZE_OPTIONS);

        const record = await db.announcement.create({
            data: {
                subject: sanitizedSubject,
                content: sanitizedContent,
                target: savedTarget,
                senderId: auth.userId,
                sentCount: successCount,
            },
        });

        // Push notification gönder
        try {
            let targetUserIds: number[] = [];
            if (specificUserIds && specificUserIds.length > 0) {
                targetUserIds = specificUserIds;
            } else if (target === "ALL") {
                const refs = await db.referee.findMany({ where: { user: { isActive: true } }, select: { userId: true } });
                const offs = await db.generalOfficial.findMany({ where: { user: { isActive: true } }, select: { userId: true } });
                targetUserIds = [...refs, ...offs].map((u) => u.userId);
            } else if (target === "REFEREE") {
                const refs = await db.referee.findMany({ where: { user: { isActive: true } }, select: { userId: true } });
                targetUserIds = refs.map((u) => u.userId);
            } else {
                const offs = await db.generalOfficial.findMany({ where: { officialType: target, user: { isActive: true } }, select: { userId: true } });
                targetUserIds = offs.map((u) => u.userId);
            }

            if (targetUserIds.length > 0) {
                const tokens = await db.pushToken.findMany({
                    where: { userId: { in: targetUserIds } },
                    select: { token: true },
                });
                if (tokens.length > 0) {
                    const isPersonal = !!(specificUserIds && specificUserIds.length > 0);
                    await sendPushNotifications(
                        tokens.map((t) => t.token),
                        {
                            title: isPersonal ? "📩 Bana Özel Duyuru" : "📢 Yeni Duyuru",
                            body: sanitizedSubject,
                            data: { type: "ANNOUNCEMENT", isPersonal, refId: record.id },
                            sound: "default",
                            channelId: "announcements",
                        }
                    );
                }
            }
        } catch (pushErr) {
            console.error("[MOBILE_ADMIN send-announcement] Push error:", pushErr);
        }

        await logAction(auth.userId, "ANNOUNCEMENT_SENT", `Mobil admin duyuru: ${successCount} kullanıcıya: ${subject}`);

        return NextResponse.json({ success: true, count: successCount });
    } catch (e) {
        console.error("[mobile/v2/admin/send-announcement] POST error:", e);
        return NextResponse.json({ error: "Duyuru gönderilemedi." }, { status: 500 });
    }
}
