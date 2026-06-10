import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "./MatchesClient";
import { nameMatches } from "@/lib/match-parser";

export const dynamic = "force-dynamic";

function normalizeNameStr(first: string, last: string) {
    return `${first} ${last}`
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
}

export default async function MatchesPage() {
    const session = await verifySession();

    const [assignments, syncState, user] = await Promise.all([
        db.userMatchAssignment.findMany({
            where: { userId: session.userId },
            include: { match: true },
            orderBy: { match: { tarihDate: "desc" } },
        }),
        db.workerSyncState.findUnique({ where: { folderKey: "current" } }),
        db.user.findUnique({
            where: { id: session.userId },
            select: {
                referee: { select: { firstName: true, lastName: true } },
                official: { select: { firstName: true, lastName: true } }
            },
        }),
    ]);

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    const fullName = `${firstName} ${lastName}`.toUpperCase().trim();
    if (fullName !== "EFE CAN BAYRAK") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Maçlarım Geçici Olarak Kapalı</h2>
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm">Bu bölüm şu an bakım nedeniyle geçici olarak devre dışı bırakılmıştır. Kısa süre içinde tekrar kullanıma açılacaktır.</p>
                </div>
            </div>
        );
    }

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
    }));

    const personnelPhones: Record<string, string> = {};

    if (matches.length > 0) {
        const allNames = new Set<string>();
        for (const m of matches) {
            [...(m.hakemler || []), ...(m.masa_gorevlileri || []), ...(m.saglikcilar || []),
             ...(m.istatistikciler || []), ...(m.gozlemciler || [])].forEach(n => allNames.add(n));
        }

        if (allNames.size > 0) {
            // Fuzzy matching: tüm hakem/görevli listesini çek, her maç ismi için nameMatches ile eşleştir
            const [referees, officials] = await Promise.all([
                db.referee.findMany({ select: { firstName: true, lastName: true, phone: true }, where: { NOT: { phone: null } } }),
                db.generalOfficial.findMany({ select: { firstName: true, lastName: true, phone: true }, where: { NOT: { phone: null } } }),
            ]);

            const allPersonnel = [
                ...referees.map(r => ({ firstName: r.firstName, lastName: r.lastName, phone: r.phone! })),
                ...officials.map(o => ({ firstName: o.firstName, lastName: o.lastName, phone: o.phone! })),
            ];

            for (const cellName of allNames) {
                for (const person of allPersonnel) {
                    if (nameMatches(cellName, person.firstName, person.lastName)) {
                        personnelPhones[normalizeNameStr(person.firstName, person.lastName)] = person.phone;
                        // Ayrıca cell ismin normalize hali ile de kaydet (client-side eşleştirmesi için)
                        personnelPhones[normalizeNameStr(cellName.split(/\s+/)[0] || "", cellName.split(/\s+/).slice(1).join(" ") || "")] = person.phone;
                        break;
                    }
                }
            }
        }
    }

    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
            initialMatches={matches}
            initialLastSync={syncState?.lastSuccessAt?.toISOString() ?? null}
            initialPersonnelPhones={personnelPhones}
        />
    );
}
