import { formatClassification } from "./format-utils";

export const CLASSIFICATION_ORDER: Record<string, number> = {
    "A Klasmanı": 0,
    "B Klasmanı": 1,
    "C Klasmanı": 2,
    "İl Hakemi": 3,
    "Aday Hakem": 4,
    "Bölge Hakemi": 5,
    "Ulusal Hakem": 6,
    "FIBA Hakemi": 7,
};

export const SHORT_CLASSIFICATION_LABEL: Record<string, string> = {
    "A Klasmanı":   "A",
    "B Klasmanı":   "B",
    "C Klasmanı":   "C",
    "İl Hakemi":    "İL",
    "Aday Hakem":   "ADAY",
    "Bölge Hakemi": "BÖLGE",
    "Ulusal Hakem": "ULUSAL",
    "FIBA Hakemi":  "FIBA",
};

const DEFAULT_REGION_ORDER: Record<string, number> = {
    "Avrupa":  0,
    "BGM":     1,
    "Anadolu": 2,
};

const AVRUPA_FIRST_ORDER: Record<string, number> = {
    "Avrupa":  0,
    "BGM":     1,
    "Anadolu": 2,
};

const ANADOLU_FIRST_ORDER: Record<string, number> = {
    "Anadolu": 0,
    "BGM":     1,
    "Avrupa":  2,
};

function primaryRegionPriority(ref: any, order: Record<string, number>): number {
    const regions: string[] = (ref?.regions ?? []).map((r: any) => r.name);
    return regions.reduce((min, r) => Math.min(min, order[r] ?? 99), 99);
}

// activeRegion: undefined = varsayılan (Avrupa önce), "Avrupa", "Anadolu", veya diğerleri (sadece alfabetik)
export function sortForms(forms: any[], group: "REFEREE" | "GENERAL", activeRegion?: string): any[] {
    const regionOrder =
        activeRegion === "Anadolu" ? ANADOLU_FIRST_ORDER
        : activeRegion === "Avrupa" ? AVRUPA_FIRST_ORDER
        : DEFAULT_REGION_ORDER;

    // Görevli tipi filtresi varsa (Gözlemci, Masa, Saha Komiseri vb.) sadece alfabetik
    const onlyAlphabetic = group === "GENERAL" && (
        activeRegion === "TYPE_FILTER" ||
        (!!activeRegion && activeRegion !== "Avrupa" && activeRegion !== "Anadolu" && activeRegion !== "BGM")
    );

    return [...forms].sort((a, b) => {
        const refA = a.referee || a.official;
        const refB = b.referee || b.official;

        if (group === "REFEREE") {
            const classA = CLASSIFICATION_ORDER[formatClassification((refA as any)?.classification)] ?? 99;
            const classB = CLASSIFICATION_ORDER[formatClassification((refB as any)?.classification)] ?? 99;
            if (classA !== classB) return classA - classB;
        }

        if (!onlyAlphabetic) {
            const regionCmp = primaryRegionPriority(refA, regionOrder) - primaryRegionPriority(refB, regionOrder);
            if (regionCmp !== 0) return regionCmp;
        }

        const nameA = `${refA?.firstName || ""} ${refA?.lastName || ""}`.trim().toLocaleUpperCase("tr-TR");
        const nameB = `${refB?.firstName || ""} ${refB?.lastName || ""}`.trim().toLocaleUpperCase("tr-TR");
        return nameA.localeCompare(nameB, "tr-TR");
    });
}
