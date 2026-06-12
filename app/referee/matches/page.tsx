import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "./MatchesClient";
import { nameMatches } from "@/lib/match-parser";
import { getSetting } from "@/lib/settings-cache";

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

    const maintenanceSetting = await getSetting("MATCHES_MAINTENANCE_MODE");
    const maintenanceMode = maintenanceSetting === "true";

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

    const isEfeCan =
        firstName.toUpperCase().includes("EFE") &&
        lastName.toUpperCase().includes("BAYRAK");

    if (maintenanceMode && !isEfeCan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
                <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tight mb-2">
                        Bakım Modunda
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase italic text-sm max-w-sm">
                        Maçlarım sayfası şu anda bakım modundadır. Lütfen daha sonra tekrar deneyin.
                    </p>
                </div>
            </div>
        );
    }

    const rawMatches = assignments.map(a => ({
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

    // Koruyucu dedupe: aynı (macAdi, tarih) çifti birden fazla ParsedMatch kaydından
    // gelebilir (duplicate sync artifact). Saat dolu olanı tercih et.
    const seenKeys = new Set<string>();
    const matches = rawMatches.filter(m => {
        const key = `${m.mac_adi.trim().toLowerCase()}|${m.tarih.trim()}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
    });

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
                db.referee.findMany({ select: { firstName: true, lastName: true, phone: true }, where: { phone: { not: "" } } }),
                db.generalOfficial.findMany({ select: { firstName: true, lastName: true, phone: true }, where: { phone: { not: "" } } }),
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
