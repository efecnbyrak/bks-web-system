import { cache } from "react";
import { db } from "@/lib/db";
import { getAllSettings } from "@/lib/settings-cache";

// Helper to get window
// `cache()` deduplicates calls within a single server render tree —
// multiple server components on the same page share one DB fetch.
export const getAvailabilityWindow = cache(async function getAvailabilityWindow() {
    // Sunucu UTC'de çalışır. openTime/deadline zaten UTC'de set edilir (setHours = UTC).
    // today de UTC olmalı — locale dönüşümü parse hatası yaratır.
    const today = new Date();

    // 1. Get settings from DB — single batched query via settings-cache
    let storedTargetDate: Date | null = null;
    let storedWeekNumber = 1;
    let setting = "AUTO";

    let isManualOverride = false;
    let lastWeekRolloverKey = "";

    try {
        const settings = await getAllSettings();

        const targetVal = settings.get("AVAILABILITY_TARGET_DATE");
        const weekVal = settings.get("CURRENT_WEEK_NUMBER");
        const modeVal = settings.get("AVAILABILITY_MODE");
        const manualVal = settings.get("AVAILABILITY_TARGET_MANUAL");
        const rolloverVal = settings.get("LAST_WEEK_ROLLOVER_DATE");

        if (targetVal) storedTargetDate = new Date(targetVal);
        if (weekVal) storedWeekNumber = parseInt(weekVal);
        if (modeVal) setting = modeVal;
        if (manualVal === "true") isManualOverride = true;
        lastWeekRolloverKey = rolloverVal || "";
    } catch (e) {
        console.error("[AVAILABILITY] Error fetching settings:", e);
    }

    // Default to 'current' Saturday if nothing stored
    // This finds the Saturday that just passed (or today if it is Saturday)
    if (!storedTargetDate) {
        const currentDay = today.getUTCDay();
        const offset = (currentDay - 6 + 7) % 7;
        storedTargetDate = new Date(today);
        storedTargetDate.setUTCDate(today.getUTCDate() - offset);
    }

    // CRITICAL: Ensure storedTargetDate is ALWAYS a Saturday
    const dayOfStored = storedTargetDate.getUTCDay();
    if (dayOfStored !== 6) {
        const backOffset = (dayOfStored - 6 + 7) % 7;
        storedTargetDate.setUTCDate(storedTargetDate.getUTCDate() - backOffset);
    }
    storedTargetDate.setUTCHours(0, 0, 0, 0);

    // Auto-expire manual override when that week's form has already closed (Tuesday 20:30).
    // This prevents the manual flag from permanently blocking auto-rollover.
    let didManualExpired = false;
    if (isManualOverride) {
        const manualWeekDeadline = new Date(storedTargetDate);
        manualWeekDeadline.setUTCDate(storedTargetDate.getUTCDate() - 4); // Tuesday before target Saturday
        manualWeekDeadline.setUTCHours(17, 30, 0, 0); // 17:30 UTC = 20:30 TRT
        if (today > manualWeekDeadline) {
            isManualOverride = false;
            didManualExpired = true;
        }
    }

    // --- AUTOMATIC ROLLOVER LOGIC ---
    let currentTarget = new Date(storedTargetDate);
    let currentWeek = storedWeekNumber;
    let didRolloverTarget = false;
    let didRolloverWeek = false;

    // 1. Rollover for Target Date (on the Saturday itself)
    // Skipped when admin has manually set the target date via settings panel.
    if (!isManualOverride) {
        while (true) {
            // Advance only after that week's submission deadline has passed (Tuesday 20:30 TRT = 17:30 UTC).
            // Rolling over on Saturday itself caused currentTarget to jump one week ahead,
            // making the form appear locked while it should be open (Sun 15:00–Tue 20:30 TRT).
            const weekDeadline = new Date(currentTarget);
            weekDeadline.setUTCDate(currentTarget.getUTCDate() - 4); // Tuesday before target Saturday
            weekDeadline.setUTCHours(17, 30, 0, 0); // 17:30 UTC = 20:30 TRT

            if (today > weekDeadline) {
                currentTarget.setUTCDate(currentTarget.getUTCDate() + 7);
                didRolloverTarget = true;
            } else {
                break;
            }
        }
    }

    // 2. Rollover for Week Number (Monday 00:00 UTC)
    // Use YYYY-MM-DD to avoid ISO timezone shifts causing double-increments
    const day = today.getUTCDay();
    const diff = (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - diff);
    const mondayKey = monday.toISOString().split('T')[0];

    if (lastWeekRolloverKey !== mondayKey) {
        currentWeek += 1;
        didRolloverWeek = true;
    }

    if (didRolloverTarget || didRolloverWeek || didManualExpired) {
        try {
            const updates = [];
            if (didManualExpired) {
                updates.push(db.systemSetting.upsert({
                    where: { key: "AVAILABILITY_TARGET_MANUAL" },
                    create: { key: "AVAILABILITY_TARGET_MANUAL", value: "false" },
                    update: { value: "false" }
                }));
            }
            if (didRolloverTarget) {
                updates.push(db.systemSetting.upsert({
                    where: { key: "AVAILABILITY_TARGET_DATE" },
                    create: { key: "AVAILABILITY_TARGET_DATE", value: currentTarget.toISOString() },
                    update: { value: currentTarget.toISOString() }
                }));
            }
            if (didRolloverWeek) {
                updates.push(db.systemSetting.upsert({
                    where: { key: "CURRENT_WEEK_NUMBER" },
                    create: { key: "CURRENT_WEEK_NUMBER", value: String(currentWeek) },
                    update: { value: String(currentWeek) }
                }));
                updates.push(db.systemSetting.upsert({
                    where: { key: "LAST_WEEK_ROLLOVER_DATE" },
                    create: { key: "LAST_WEEK_ROLLOVER_DATE", value: mondayKey },
                    update: { value: mondayKey }
                }));
            }
            await db.$transaction(updates);
        } catch (e) {
            console.error("[AVAILABILITY] Rollover failed:", e);
        }
    }

    // 2. Window Calculations (Strictly Anchored to Saturday)
    // currentTarget is the Saturday of the OPERATIONAL week.
    const startDate = new Date(currentTarget);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(currentTarget);
    endDate.setUTCDate(currentTarget.getUTCDate() + 6); // Friday
    endDate.setUTCHours(20, 59, 59, 999); // 20:59:59 UTC = 23:59:59 TRT (aynı gün kalır)

    // Opening: Sunday BEFORE the operational week (currentTarget - 6 days)
    const openTime = new Date(currentTarget);
    openTime.setUTCDate(currentTarget.getUTCDate() - 6);
    openTime.setUTCHours(12, 0, 0, 0); // 12:00 UTC = 15:00 TRT

    // Closing: Tuesday OF the current submission week (currentTarget - 4 days)
    const deadline = new Date(currentTarget);
    deadline.setUTCDate(currentTarget.getUTCDate() - 4);
    deadline.setUTCHours(17, 30, 0, 0); // 17:30 UTC = 20:30 TRT

    // 3. Lock Status
    let isLocked = today < openTime || today > deadline;
    if (setting === "OPEN") isLocked = false;
    else if (setting === "CLOSED") isLocked = true;

    return {
        startDate,
        endDate,
        deadline,
        openTime,
        isLocked,
        mode: setting,
        weekNumber: currentWeek
    };
});
