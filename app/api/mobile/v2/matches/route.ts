import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const [assignments, syncState] = await Promise.all([
            db.userMatchAssignment.findMany({
                where: { userId: auth.userId },
                include: { match: true },
                orderBy: { match: { tarihDate: "desc" } },
            }),
            db.workerSyncState.findUnique({ where: { folderKey: "current" } }),
        ]);

        const matches = assignments.map((a) => ({
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
            fromCache: false,
        });
    } catch (error: any) {
        console.error("[mobile/v2/matches] GET error:", error?.message);
        return NextResponse.json({ error: "Maç verileri yüklenirken hata oluştu." }, { status: 500 });
    }
}
