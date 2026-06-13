import { SettingsForm } from "./SettingsForm";
import { PhoneFixPanel } from "./PhoneFixPanel";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings-cache";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    // Fetch settings — uses batched single-query cache
    const [settingsMap, window] = await Promise.all([
        getSettings("AVAILABILITY_MODE", "CURRENT_SEASON", "IBAN_COLLECTION_ENABLED", "MATCHES_MAINTENANCE_MODE", "ACHIEVEMENTS_MAINTENANCE_MODE"),
        getAvailabilityWindow(),
    ]);

    const session = await verifySession();
    
    if (session?.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold mb-8">Sistem Ayarları</h1>
                <SettingsForm
                    initialMode={settingsMap["AVAILABILITY_MODE"] || "AUTO"}
                    initialSeason={settingsMap["CURRENT_SEASON"] || "2025-2026"}
                    initialTargetDate={window.startDate.toISOString()}
                    initialWeekNumber={window.weekNumber.toString()}
                    initialIbanRequired={settingsMap["IBAN_COLLECTION_ENABLED"] === "true"}
                    initialMaintenanceMode={settingsMap["MATCHES_MAINTENANCE_MODE"] === "true"}
                    initialAchievementsMaintenanceMode={settingsMap["ACHIEVEMENTS_MAINTENANCE_MODE"] === "true"}
                    isSuperAdmin={session?.role === "SUPER_ADMIN"}
                />
            </div>
            <PhoneFixPanel />
        </div>
    );
}
