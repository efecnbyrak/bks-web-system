import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "@/app/referee/matches/MatchesClient";

export const dynamic = "force-dynamic";

function normalizeNameStr(first: string, last: string) {
    return `${first} ${last}`
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
}

export default async function GeneralMatchesPage() {
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

        const nameParts = [...allNames].map(n => {
            const parts = n.trim().split(/\s+/);
            return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
        }).filter(p => p.firstName && p.lastName);

        if (nameParts.length > 0) {
            const [referees, officials] = await Promise.all([
                db.referee.findMany({
                    where: { OR: nameParts.map(p => ({ firstName: { equals: p.firstName, mode: "insensitive" }, lastName: { equals: p.lastName, mode: "insensitive" } })) },
                    select: { firstName: true, lastName: true, phone: true }
                }),
                db.generalOfficial.findMany({
                    where: { OR: nameParts.map(p => ({ firstName: { equals: p.firstName, mode: "insensitive" }, lastName: { equals: p.lastName, mode: "insensitive" } })) },
                    select: { firstName: true, lastName: true, phone: true }
                }),
            ]);

            referees.forEach(r => {
                if (r.phone) personnelPhones[normalizeNameStr(r.firstName, r.lastName)] = r.phone;
            });
            officials.forEach(o => {
                if (o.phone) personnelPhones[normalizeNameStr(o.firstName, o.lastName)] = o.phone;
            });
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
