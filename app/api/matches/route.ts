import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { checkAndIncrementRefreshQuota } from "@/lib/match-refresh-quota";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
        }

        // Manuel yenileme ise quota kontrol et
        const isManual = req.nextUrl.searchParams.get("manual") === "true";
        if (isManual) {
            const quota = await checkAndIncrementRefreshQuota(session.userId);
            if (!quota.allowed) {
                const blocked = quota as { allowed: false; retryAfterMs: number };
                return NextResponse.json(
                    { error: "quota_exceeded", retryAfterMs: blocked.retryAfterMs },
                    { status: 429 }
                );
            }
        }

        const [assignments, syncState] = await Promise.all([
            db.userMatchAssignment.findMany({
                where: { userId: session.userId, match: { cancelledAt: null } },
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
            fromCache: false,
        });

    } catch (error: any) {
        console.error("[MATCHES API] Error:", error?.message);
        return NextResponse.json(
            { error: "Maç verileri yüklenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
