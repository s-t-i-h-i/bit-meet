"use client"
import { useActionState, useMemo, useState, useTransition } from "react"
import AvailabilityGrid from "@/app/components/availabilityGrid"
import type { SlotInfo } from "@/app/components/helpers"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clearAvailability, joinEvent, leaveEvent, removeParticipant, saveAvailability } from "@/app/actions"

type Props = {
    participants?: { id: string; name: string }[]; // tylko dla twórcy
    slug: string;
    eventName: string;
    slots: string[];
    timeZone: string;
    me: { name: string } | null;
    initialSelected: string[];
    othersResult: Record<string, SlotInfo>;
    participantCount: number;
    isAdmin: boolean;
};

export default function EventView({ slug, eventName, slots, timeZone, me, initialSelected, othersResult, participantCount, isAdmin, participants = [] }: Props) {
    // useState ignoruje nowe initialSelected po zapisie - lokalny stan jest juz aktualny
    const [selected, setSelected] = useState(() => new Set(initialSelected))
    const [isPending, startTransition] = useTransition()
    const [saveError, setSaveError] = useState<string | null>(null)
    const [state, formAction, pending] = useActionState(joinEvent.bind(null, slug), { error: null })

    //resultat ustalany na biezaco na podstawie zaznaczenia uzytkownika
    const liveResult = useMemo(() => {
        const out: Record<string, SlotInfo> = {}
        //dla kazdego slotu
        for (const slot of slots) {
            // wydobac info o slocie, lub ustaw na 0 gdy nie ma
            const info = othersResult[slot] ?? { count: 0, names: [] }
            
            out[slot] = me && selected.has(slot) ? {count: info.count + 1 , names: [...info.names, me.name] } : {count: info.count, names: info.names }
        }
        return out
    }, [slots, othersResult, selected, me])

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
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{eventName}</h1>
                {isAdmin && <Badge variant="secondary">Twórca</Badge>}
            </div>

            {saveError && (
                <Alert variant="destructive">
                    <AlertDescription>{saveError}</AlertDescription>
                </Alert>
            )}

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Panel twórcy</CardTitle>
                        <CardDescription>Uczestnicy ({participants.length})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {participants.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nikt jeszcze nie dołączył.</p>
                        ) : (
                            <ul className="flex flex-col divide-y">
                                {participants.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between py-2">
                                        <span>{p.name}</span>
                                        <Button type="button" variant="destructive" size="sm" onClick={() => handleRemove(p.id, p.name)} disabled={isPending}>
                                            Usuń
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}


                <Card>
                    <CardHeader>
                        <CardTitle> dostępność</CardTitle>
                        <CardDescription>{me?.name} · kliknij lub przeciągnij, aby zaznaczyć sloty</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <AvailabilityGrid slots={slots} timeZone={timeZone} mode={me ? "edit" : "view"} selectedSlots={selected} result={liveResult} participantCount={participantCount} setSelectedSlots={setSelected} />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={handleSave} disabled={isPending}>
                                {isPending ? "Zapisywanie…" : "Zapisz"}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClear} disabled={isPending}>Wyczyść</Button>
                            <Button type="button" variant="ghost" onClick={handleLeave} disabled={isPending}>Opuść</Button>
                        </div>
                    </CardContent>
                </Card>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Dołącz do wydarzenia</CardTitle>
                    <CardDescription>Podaj imię, żeby zaznaczyć dostępność.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Imię</Label>
                            <Input id="name" name="name" maxLength={30} required />
                        </div>
                        {state.error && (
                            <Alert variant="destructive">
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" disabled={pending}>Dołącz</Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}
