"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function markSectionVisited(section: "kural" | "yorum") {
    const session = await getSession();
    if (!session?.userId) return { error: "Oturum açmanız gerekiyor." };

    try {
        await db.sectionVisit.upsert({
            where: {
                userId_section: {
                    userId: session.userId,
                    section,
                },
            },
            create: { userId: session.userId, section },
            update: { visitedAt: new Date() },
        });

        revalidatePath("/referee/profile");
        revalidatePath("/referee/bag/rules");
        return { success: true };
    } catch (error) {
        console.error("markSectionVisited error:", error);
        return { error: "Ziyaret kaydedilemedi." };
    }
}

export async function getSectionVisits() {
    const session = await getSession();
    if (!session?.userId) return { kuralVisited: false, yorumVisited: false };

    try {
        const visits = await db.sectionVisit.findMany({
            where: { userId: session.userId },
            select: { section: true },
        });
        return {
            kuralVisited: visits.some((v) => v.section === "kural"),
            yorumVisited: visits.some((v) => v.section === "yorum"),
        };
    } catch {
        return { kuralVisited: false, yorumVisited: false };
    }
}

export async function markArticleRead(articleId: string, type: "kural" | "yorum") {
    const session = await getSession();
    if (!session?.userId) return { error: "Oturum açmanız gerekiyor." };

    try {
        await db.ruleProgress.upsert({
            where: {
                userId_articleId_type: {
                    userId: session.userId,
                    articleId,
                    type,
                },
            },
            create: { userId: session.userId, articleId, type },
            update: { readAt: new Date() },
        });
        return { success: true };
    } catch (error) {
        console.error("markArticleRead error:", error);
        return { error: "İlerleme kaydedilemedi." };
    }
}

export async function getRuleProgress(type: "kural" | "yorum"): Promise<string[]> {
    const session = await getSession();
    if (!session?.userId) return [];

    try {
        const rows = await db.ruleProgress.findMany({
            where: { userId: session.userId, type },
            select: { articleId: true },
        });
        return rows.map((r) => r.articleId);
    } catch {
        return [];
    }
}
