import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation"
import { aggregate, generateSlots } from "@/app/components/helpers";
import { getCurrentParticipant, isAdmin } from "@/lib/participant";
import EventView from "./eventView";

// komponent serwerowy strony wydarzenia.
// Pobiera dane z bazy, liczy wynik i przekazuje gotowe dane do komponentu klienckiego z siatka.
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // 1. Wydarzenie
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) notFound();

    // 2. Uczestnicy + ich sloty, tylko potrzebne pola
    const participants = await prisma.participant.findMany({
        where: { eventId: event.id },
        select: { id: true, name: true, availability: { select: { slot: true } } },
    });

    // 4. Siatka i wynik - OLD
    const dates = JSON.parse(event.dates) as string[];
    const slots = generateSlots(dates, event.startMinutes, event.endMinutes, event.slotMinutes, event.timeZone);

    // 5. Biezacy uzytkownik
    const me = await getCurrentParticipant(event.id, slug);
    const initialSelected = me
        ? participants.find((p) => p.id === me.id)?.availability.map((a) => a.slot) ?? []
        : [];

    // version for unified calendar
    const otherParticipants = participants.filter((p) => me?.id !== p.id)
    const forAggregateOthers = otherParticipants.map((p) => ({ name: p.name, slots: p.availability.map((a) => a.slot) }));
    const othersResult = aggregate(slots,forAggregateOthers)


    // 6. Tworca
    const admin = await isAdmin(event);

    // do klienta tylko potrzebne pola (bez id, tokenHash, adminTokenHash)
    return (
        <EventView
            key={me?.id ?? "guest"}
            participants={admin ? participants.map((p) => ({ id: p.id, name: p.name })) : undefined}
            slug={slug}
            eventName={event.name}
            slots={slots}
            timeZone={event.timeZone}
            me={me ? { name: me.name } : null}
            initialSelected={initialSelected}
            othersResult={othersResult}
            participantCount={participants.length}
            isAdmin={admin}
        />
    );
}
