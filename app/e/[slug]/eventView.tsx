"use client"
import { useActionState, useState, useTransition } from "react"
import AvailabilityGrid from "@/app/components/availabilityGrid"
import type { SlotInfo } from "@/app/components/helpers"
import { clearAvailability, joinEvent, leaveEvent, removeParticipant, saveAvailability } from "@/app/actions"

type Props = {
    participants?: { id: string; name: string }[]; // tylko dla twórcy
    slug: string;
    eventName: string;
    slots: string[];
    timeZone: string;
    me: { name: string } | null;
    initialSelected: string[];
    result: Record<string, SlotInfo>;
    participantCount: number;
    isAdmin: boolean;
};

export default function EventView({ slug, eventName, slots, timeZone, me, initialSelected, result, participantCount, isAdmin, participants = [] }: Props) {
    // useState ignoruje nowe initialSelected po zapisie - lokalny stan jest juz aktualny
    const [selected, setSelected] = useState(() => new Set(initialSelected))
    const [isPending, startTransition] = useTransition()
    const [saveError, setSaveError] = useState<string | null>(null)
    const [state, formAction, pending] = useActionState(joinEvent.bind(null, slug), { error: null })

    const handleSave = () => {
        setSaveError(null)
        startTransition(async () => {
            const res = await saveAvailability(slug, [...selected])
            if (res.error) setSaveError(res.error)
        })
    }

    const handleClear = () => {
        setSaveError(null)
        startTransition(async () => {
            const res = await clearAvailability(slug)
            if (res.error) setSaveError(res.error)
            else setSelected(new Set())
        })
    }

    const handleLeave = () => {
        if (!confirm("Na pewno opuścić wydarzenie? Twoja dostępność zostanie usunięta.")) return
        setSaveError(null)
        startTransition(async () => {
            const res = await leaveEvent(slug)
            if (res.error) setSaveError(res.error)
        })
    }

    const handleRemove = (participantId: string, name: string) => {
        if (!confirm(`Usunąć uczestnika ${name}?`)) return
        setSaveError(null)
        startTransition(async () => {
            const res = await removeParticipant(slug, participantId)
            if (res.error) setSaveError(res.error)
        })
    }

    return (
        <main className="flex flex-col gap-6 p-8">
            <h1 className="text-2xl font-semibold">{eventName}</h1>

            {isAdmin && (
                <section>
                    <h2 className="mb-2 font-semibold">Panel twórcy</h2>
                    <ul className="flex flex-col gap-1">
                        {participants.map((p) => (
                            <li key={p.id} className="flex items-center gap-2">
                                <span>{p.name}</span>
                                <button type="button" onClick={() => handleRemove(p.id, p.name)} disabled={isPending} className="rounded border px-2 text-sm">Usuń</button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {saveError && <p className="text-red-600">{saveError}</p>}

            {me ? (
                <section>
                    <h2 className="mb-2 font-semibold">Twoja dostępność ({me.name})</h2>
                    <AvailabilityGrid slots={slots} timeZone={timeZone} mode="edit" selectedSlots={selected} setSelectedSlots={setSelected} />
                    <button type="button" onClick={handleSave} disabled={isPending} className="mt-2 rounded border px-3 py-1">
                        {isPending ? "Zapisywanie…" : "Zapisz"}
                    </button>
                    <button type="button" onClick={handleClear} disabled={isPending} className="mt-2 ml-2 rounded border px-3 py-1">Wyczyść</button>
                    <button type="button" onClick={handleLeave} disabled={isPending} className="mt-2 ml-2 rounded border px-3 py-1">Opuść</button>
                </section>
            ) : (
                <form action={formAction} className="flex flex-col items-start gap-2">
                    <label htmlFor="name">Podaj imię, żeby zaznaczyć dostępność</label>
                    <input id="name" name="name" maxLength={30} required className="rounded border px-2 py-1" />
                    <button type="submit" disabled={pending} className="rounded border px-3 py-1">Dołącz</button>
                    {state.error && <p className="text-red-600">{state.error}</p>}
                </form>
            )}

            <section>
                <h2 className="mb-2 font-semibold">Wszyscy ({participantCount})</h2>
                <AvailabilityGrid slots={slots} timeZone={timeZone} mode="heatmap" result={result} participantCount={participantCount} />
            </section>
        </main>
    )
}
