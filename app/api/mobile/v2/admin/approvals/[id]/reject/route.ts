// Onay bekleyen kullanıcıyı reddeder ve tüm verilerini siler (geri alınamaz).
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
        await db.$transaction(async (tx: any) => {
            await tx.referee.deleteMany({ where: { userId } });
            await tx.generalOfficial.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        });

        await logAction(auth.userId, "USER_REJECTED", `Kullanıcı başvurusu reddedildi ve silindi. Hedef UID: ${userId}`, userId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[mobile/v2/admin/approvals/[id]/reject] POST error:", e);
        return NextResponse.json({ error: "Kullanıcı reddedilirken bir hata oluştu." }, { status: 500 });
    }
}
