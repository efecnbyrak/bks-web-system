// Belirli bir gözlemci raporunu silme endpoint'i.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { logAction } from "@/lib/logger";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
        return NextResponse.json({ error: "Geçersiz rapor ID." }, { status: 400 });
    }

    try {
        await db.observerReport.delete({ where: { id: reportId } });
        await logAction(auth.userId, "OBSERVER_REPORT_DELETED", `Rapor silindi. ID: ${reportId}`);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("[mobile/v2/admin/observer-reports/[id]] DELETE error:", e);
        return NextResponse.json({ error: "Rapor silinirken bir hata oluştu." }, { status: 500 });
    }
}
