import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("userId") || "");
    if (!userId) return NextResponse.json({ error: "userId gerekli" }, { status: 400 });

    const [assignments, syncState] = await Promise.all([
        db.userMatchAssignment.findMany({
            where: { userId },
            include: { match: true },
            orderBy: { match: { tarihDate: "desc" } },
        }),
        db.workerSyncState.findUnique({ where: { folderKey: "current" } }),
    ]);

    const matches = assignments.map(a => ({
        mac_adi: a.match.macAdi,
        tarih: a.match.tarih,
        saat: a.match.saat ?? undefined,
        salon: a.match.salon ?? undefined,
        kategori: a.match.kategori,
        hafta: a.match.hafta ?? undefined,
        sezon: a.match.sezon ?? undefined,
        ligTuru: a.match.ligTuru,
        hakemler: a.match.hakemler,
        masa_gorevlileri: a.match.masaGorevlileri,
        saglikcilar: a.match.saglikcilar,
        istatistikciler: a.match.istatistikciler,
        gozlemciler: a.match.gozlemciler,
        sahaKomiserleri: a.match.sahaKomiserleri,
        kaynak_dosya: a.match.kaynakDosya,
        myRole: a.role,
        nameInSpreadsheet: a.nameInSpreadsheet,
    }));

    return NextResponse.json({
        matches,
        lastSync: syncState?.lastSuccessAt ?? null,
    });
}
