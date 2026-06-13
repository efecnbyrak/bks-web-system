"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionVoidResult } from "@/lib/types/actions";
import { ROUTES } from "@/lib/routes";

export async function clearOldAnnouncementsAdmin(): Promise<ActionVoidResult> {
    try {
        const readsDeleted = await db.announcementRead.deleteMany({});
        const deleted = await db.announcement.deleteMany({});
        console.log(`[INIT CLEANUP] Deleted ${readsDeleted.count} reads and ${deleted.count} announcements.`);

        revalidatePath(ROUTES.REFEREE_ANNOUNCEMENTS);
        revalidatePath(ROUTES.GENERAL_ANNOUNCEMENTS);
        revalidatePath(ROUTES.ADMIN_ANNOUNCEMENTS);

        return { success: true };
    } catch (error) {
        console.error("Cleanup Error:", error);
        return { success: false, error: (error as Error).message };
    }
}
