import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { TicketForm } from "@/app/referee/components/TicketForm";

export default async function RefereeTicketPage() {
    const session = await verifySession();
    if (!session.userId) redirect("/");

    return (
        <div className="p-4 md:p-6 pb-24 md:pb-6">
            <TicketForm />
        </div>
    );
}
