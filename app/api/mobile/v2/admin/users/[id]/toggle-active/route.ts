// Kullanıcının aktif/pasif durumunu toggle eder.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
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
        const user = await db.user.findUnique({ where: { id: userId }, select: { isActive: true } });
        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const updated = await db.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
            select: { isActive: true },
        });

        await logAction(
            auth.userId,
            updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            `Kullanıcı ${updated.isActive ? "aktif edildi" : "pasif yapıldı"}. Hedef UID: ${userId}`,
            userId
        );

        return NextResponse.json({ success: true, isActive: updated.isActive });
    } catch (e) {
        console.error("[mobile/v2/admin/users/[id]/toggle-active] POST error:", e);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}
