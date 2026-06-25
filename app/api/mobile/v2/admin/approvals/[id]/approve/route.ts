// Onay bekleyen kullanıcıyı onaylar ve e-posta gönderir.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { sendEmailSafe } from "@/lib/email";
import { logAction } from "@/lib/logger";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
        return NextResponse.json({ error: "Geçersiz kullanıcı ID." }, { status: 400 });
    }

    try {
        const user = await db.user.update({
            where: { id: userId },
            data: { isApproved: true },
            include: { referee: true, official: true },
        });

        const profile = user.referee ?? user.official;
        if (profile?.email) {
            await sendEmailSafe(
                profile.email,
                "Hesabınız Onaylandı - Basketbol Koordinasyon Sistemi",
                `<p>Sayın <strong>${profile.firstName} ${profile.lastName}</strong>,</p><p>Hesabınız yönetici tarafından onaylanmıştır. Artık sisteme giriş yapabilirsiniz.</p>`
            );
        }

        await logAction(auth.userId, "USER_APPROVED", `Kullanıcı onaylandı. Hedef UID: ${userId}`, userId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[mobile/v2/admin/approvals/[id]/approve] POST error:", e);
        return NextResponse.json({ error: "Kullanıcı onaylanırken bir hata oluştu." }, { status: 500 });
    }
}
