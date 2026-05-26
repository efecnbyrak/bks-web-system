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

const REGION_ORDER: Record<string, number> = {
    "Avrupa":  0,
    "BGM":     1,
    "Anadolu": 2,
};

function primaryRegionPriority(ref: any): number {
    const regions: string[] = (ref?.regions ?? []).map((r: any) => r.name);
    return regions.reduce((min, r) => Math.min(min, REGION_ORDER[r] ?? 99), 99);
}

export function sortForms(forms: any[], group: "REFEREE" | "GENERAL"): any[] {
    return [...forms].sort((a, b) => {
        const refA = a.referee || a.official;
        const refB = b.referee || b.official;

        if (group === "REFEREE") {
            const classA = CLASSIFICATION_ORDER[formatClassification((refA as any)?.classification)] ?? 99;
            const classB = CLASSIFICATION_ORDER[formatClassification((refB as any)?.classification)] ?? 99;
            if (classA !== classB) return classA - classB;
        }

        const regionCmp = primaryRegionPriority(refA) - primaryRegionPriority(refB);
        if (regionCmp !== 0) return regionCmp;

        const nameA = `${refA?.firstName || ""} ${refA?.lastName || ""}`.trim().toLocaleUpperCase("tr-TR");
        const nameB = `${refB?.firstName || ""} ${refB?.lastName || ""}`.trim().toLocaleUpperCase("tr-TR");
        return nameA.localeCompare(nameB, "tr-TR");
    });
}
