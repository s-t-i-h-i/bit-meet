"use client"
import { useActionState, useMemo, useState, useTransition } from "react"
import AvailabilityGrid from "@/app/components/availabilityGrid"
import { bestSlots, type SlotInfo } from "@/app/components/helpers"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { chooseFinalRange, clearAvailability, joinEvent, leaveEvent, removeParticipant, saveAvailability } from "@/app/actions"
import { Tabs, TabsTrigger,TabsList, TabsContent } from "@/components/ui/tabs"

type Props = {
    participants?: { id: string; name: string }[];
    slug: string;
    eventName: string;
    slots: string[];
    timeZone: string;
    slotMinutes: number;
    finalStart?: string | null;
    finalEnd?: string | null;
    me: { name: string } | null;
    initialSelected: string[];
    othersResult: Record<string, SlotInfo>;
    participantCount: number;
    isAdmin: boolean;
};

export default function EventView({ slug, eventName, slots, timeZone, slotMinutes, me, initialSelected, othersResult, participantCount, isAdmin,finalEnd,finalStart, participants = [] }: Props) {
    // useState ignoruje nowe initialSelected po zapisie - lokalny stan jest juz aktualny
    const [selected, setSelected] = useState(() => new Set(initialSelected))
    const [pickingFinal, setPickingFinal] = useState(false)
    const [finalDraft, setFinalDraft] = useState<Set<string>>(new Set())
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

    const finalSlots = useMemo(() => {
        if(!finalStart || !finalEnd)return new Set<string>();
        //porownywanie stringo w ISO, porownywanie alfabetycznego ukladu
        return new Set(slots.filter((s) => s>= finalStart && s < finalEnd))
    },[slots,finalStart,finalEnd])

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
    
    const handlePickingFinal = () => {
        setPickingFinal(true)
    }

    const handleLeavingPickingFinal = () => {
        setPickingFinal(false)
        setFinalDraft(new Set())
    }

    const handleConfimringFinal = () => {
        if (!confirm("Na pewno wybrać ten termin? Kalendarz zostanie schowany, uczestnicy nie będą mogli już zaznaczać ani zmieniać dostępności, a nowe osoby nie będą mogły dołączyć. Tej operacji nie można cofnąć.")) return
        setSaveError(null)
        startTransition(async() => {
            const res = await chooseFinalRange(slug,[...finalDraft])
            // przy bledzie zostajemy w trybie wyboru, zeby tworca mogl poprawic zaznaczenie
            if (res.error) setSaveError(res.error)
            else {
                setFinalDraft(new Set())
                setPickingFinal(false)
            }
        })
    }

    // termin wybrany -> zaznaczanie zablokowane (serwer i tak odrzuca zapisy)
    const isFinalized = !!finalStart


    // lista uczestnikow - wspolna dla zakladki tworcy i widoku zwyklego uzytkownika
    const participantList = participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nikt jeszcze nie dołączył.</p>
    ) : (
        <ul className="flex flex-col divide-y">
            {participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                    <span>{p.name}</span>
                    {/* usuwac moze tylko tworca - serwer i tak sprawdza token admina */}
                    {isAdmin && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleRemove(p.id, p.name)} disabled={isPending}>
                            Usuń
                        </Button>
                    )}
                </li>
            ))}
        </ul>
    )

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

            {isFinalized && finalEnd && (
                <Card className="py-10">
                    <CardContent className="flex flex-col items-center gap-3 text-center">
                        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Termin spotkania</p>
                        <p className="text-3xl font-semibold tracking-tight text-balance first-letter:uppercase sm:text-5xl">
                            {new Date(finalStart).toLocaleDateString("pl-PL", { timeZone, weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-2xl font-medium text-muted-foreground sm:text-4xl">
                            {new Date(finalStart).toLocaleTimeString("pl-PL", { timeZone, hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(finalEnd).toLocaleTimeString("pl-PL", { timeZone, hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {/* kalendarz jest schowany, wiec "Opuść" musi byc tutaj */}
                        {me && <Button type="button" variant="ghost" className="mt-4" onClick={handleLeave} disabled={isPending}>Opuść</Button>}
                    </CardContent>
                </Card>
            )}

            {!me && !isFinalized && (
            <Card>
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
            )}

                {/* po wyborze terminu kalendarz jest niepotrzebny - zostaje tylko karta z terminem */}
                {!isFinalized && (
                <Card>
                    <CardHeader>
                        <CardTitle> {pickingFinal ? "Wybierz ostateczny termin spotkania" : "dostępność"}</CardTitle>
                        <CardDescription>
                            {pickingFinal
                                ? "po wybraniu tego terminu zaznaczanie dostępności zostanie wyłączone"
                                : `${me ? `${me.name} · ` : ""}kliknij lub przeciągnij, aby zaznaczyć sloty`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {/* tworca moze wybierac termin nawet bez dolaczenia jako uczestnik */}
                        <AvailabilityGrid slots={slots} timeZone={timeZone} mode={pickingFinal || me ? "edit" : "view"} selectedSlots={pickingFinal ? finalDraft : selected} finalSlots={finalSlots} result={liveResult} participantCount={participantCount} setSelectedSlots={pickingFinal ? setFinalDraft : setSelected} variant={pickingFinal ? 'final' : 'availability'}/>
                        {(me || isAdmin) &&
                        <div className="flex flex-wrap gap-2">

                            {!pickingFinal ?
                            <>
                                {me && <>
                                    <Button type="button" onClick={handleSave} disabled={isPending}>
                                        {isPending ? "Zapisywanie…" : "Zapisz"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={isPending}>Wyczyść</Button>
                                </>}
                                {isAdmin && <Button type="button" variant="outline" onClick={handlePickingFinal} disabled={isPending}>Ostateczny Termin</Button>}
                                {me && <Button type="button" variant="ghost" onClick={handleLeave} disabled={isPending}>Opuść</Button>}
                            </>:
                            <>
                                <Button type="button" variant="outline" onClick={handleConfimringFinal} disabled={isPending}>Wybierz Termin</Button>
                                <Button type="button" variant="destructive" onClick={handleLeavingPickingFinal} disabled={isPending}>Anuluj</Button>
                            </>}
                        </div>}
                    </CardContent>
                </Card>
                )}

            <Card>
                    <CardContent>
                        {isAdmin ? (
                        <Tabs defaultValue="uczestnicy">
                            <TabsList>
                                <TabsTrigger value="uczestnicy">Uczestnicy ({participants.length})</TabsTrigger>
                                <TabsTrigger value="najlepsze terminy">Najlepsze terminy</TabsTrigger>
                            </TabsList>
                            <TabsContent value="uczestnicy">
                                {participantList}
                            </TabsContent>
                            <TabsContent value="najlepsze terminy">
                                {bestSlots(liveResult, slotMinutes, 10).map((slot) => (
                                    <div key={slot.start} className="flex items-center justify-between py-2">
                                        <span>
                                            {new Date(slot.start).toLocaleString("pl-PL", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            {" – "}
                                            {new Date(slot.end).toLocaleTimeString("pl-PL", { timeZone, hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        <span title={slot.names.join(", ")} className="text-sm text-muted-foreground">{slot.count}/{participantCount}</span>
                                    </div>
                                ))}
                            </TabsContent>
                        </Tabs>
                        ) : participantList}
                    </CardContent>
                </Card>

        </main>
    )
}
