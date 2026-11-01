"use client"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { tz } from "@date-fns/tz"
import type { SlotInfo } from "./helpers"
import { Check } from "lucide-react"

type Props = {
  slots: string[];
  timeZone: string;
  mode: "edit" | "view";
  // tryb edit
  selectedSlots?: Set<string>;
  setSelectedSlots?: React.Dispatch<React.SetStateAction<Set<string>>>;
  //tylko view
  result: Record<string, SlotInfo>;
  participantCount?: number;
  // final = tworca zaznacza ostateczny termin (zaznaczenie na czerwono)
  variant?: "availability" | "final"
  finalSlots?: Set<string>
};

export default function AvailabilityGrid({ slots, timeZone, mode, selectedSlots = new Set(), setSelectedSlots, result, participantCount = 0, variant = "availability", finalSlots }: Props) {
    const editable = mode === "edit" && !!setSelectedSlots

    // przeciaganie: nie wplywa na wyglad, wiec refy zamiast stanu (bez opoznienia miedzy zdarzeniami)
    const isDragging = useRef(false)
    const dragMode = useRef<"add" | "remove">("add")

    // zastosuj dragMode do slotu; nowy Set, zeby React odswiezyl widok
    const applySlot = (slot: string) => {
        setSelectedSlots?.((prev) => {
            //jezeli juz zaznaczony i tryb dodawania, nic nie rob
            if (prev.has(slot) === (dragMode.current === "add")) return prev

            //dodaj do setu lub usun w zaleznosci od dragMode
            const next = new Set(prev)
            if (dragMode.current === "add") next.add(slot)
            else next.delete(slot)
            return next
        })
    }

    const slotAt = (e: React.PointerEvent) =>
        document.elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-cell]")?.dataset.cell

    const handlePointerDown = (e: React.PointerEvent) => {
        //na jaki slot
        const slot = slotAt(e)
        //jezeli zaden to nie robimy nic
        if (!slot) return
        // skoro nacisnales to mozesz przeciagac
        isDragging.current = true
        // zaleznie od tego czy juz zaznaczony, ustawiamy tryb przeciagaania
        dragMode.current = selectedSlots.has(slot) ? "remove" : "add"
        applySlot(slot)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        // jezeli nie przeciagamy to nic nie robimy
        if (!isDragging.current) return
        //aktualizuj sloty po ktorych przeciagamyc
        const slot = slotAt(e)
        if (slot) applySlot(slot)
    }

    // nasluchiwanie zdarzen pointer up i pointecancel na calym oknie, zeby zakonczyc przeciaganie nawet gdy kursor jest poza siatka
    useEffect(() => {
        const stop = () => { isDragging.current = false }
        window.addEventListener("pointerup", stop)
        window.addEventListener("pointercancel", stop)
        //po wyjsciu z komponentu usuwamy nasluchiwanie zdarzen
        return () => {
            window.removeEventListener("pointerup", stop)
            window.removeEventListener("pointercancel", stop)
        }
    }, [])

    // uklad siatki nie zmienia sie przy zaznaczaniu, wiec liczymy go raz
    const { days, times, lookup } = useMemo(() => {
        // 1. kazdy slot -> slot + dzien + godzina w strefie wydarzenia
        const cells = slots.map((slot) => ({
            slot: slot,
            day: format(new Date(slot), "yyyy-MM-dd", { in: tz(timeZone) }),
            time: format(new Date(slot), "HH:mm", { in: tz(timeZone) }),
        }));
        // 2. unikalne dni (kolumny) i godziny (wiersze)
        const days = [...new Set(cells.map((c) => c.day))].sort();
        const times = [...new Set(cells.map((c) => c.time))].sort();
        // 3. slownik do wyszukiwania komorki
        const lookup = new Map(cells.map((c) => [`${c.day}|${c.time}`, c.slot]));
        return { days, times, lookup };
    }, [slots, timeZone]);

    // ostatnio dotkniety/najechany kafelek - na telefonie nie ma hovera, wiec title z imionami jest niewidoczny
    const [activeSlot, setActiveSlot] = useState<string>()
    const trackActive = (e: React.PointerEvent) => {
        const slot = slotAt(e)
        if (slot) setActiveSlot(slot)
    }
    const activeInfo = activeSlot ? result[activeSlot] : undefined

    // 4. CSS Grid wypelnia wierszami: petla zewnetrzna po godzinach, wewnetrzna po dniach
    return (
        <div className="flex flex-col gap-2">
        {/* przy wielu dniach siatka jest szersza niz telefon - przewijamy ja w poziomie zamiast sciskac kolumny */}
        <div className="overflow-x-auto">
        <div
            className="grid gap-1 select-none text-sm [-webkit-touch-callout:none]"
            onPointerDown={(e) => { trackActive(e); if (editable) handlePointerDown(e) }}/*gdy uytkownik naciśnie nad tabelą */
            onPointerMove={(e) => { trackActive(e); if (editable) handlePointerMove(e) }}/*aktywacja gdy kursor zmienia swoje polozenie*/
            style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(2.75rem, 1fr))` }}
        >
            <div className="sticky left-0 z-10 bg-card" />
            {days.map((day) => (
                //dla kazdego dnia zbuduj nagłówek z jego datą - krotko, zeby zmiescil sie w waskiej kolumnie
                <div key={day} className="flex flex-col items-center leading-tight">
                    <span className="text-xs text-muted-foreground">
                        {new Date(`${day}T12:00:00Z`).toLocaleDateString("pl-PL", { timeZone: "UTC", weekday: "short" })}
                    </span>
                    <span className="font-medium">{Number(day.slice(8))}.{day.slice(5, 7)}</span>
                </div>
            ))}
            {times.map((time) => (
                //dla kazdej godziny
                <Fragment key={time}>
                    {/*pierwsza kolumna to napisana godzina - przyklejona, zeby byla widoczna przy przewijaniu w poziomie */}
                    <div className="sticky left-0 z-10 flex items-center justify-end bg-card pr-2 text-xs text-muted-foreground">{time}</div>
                    {/*dla kazdego kafelka dnia */}
                    {days.map((day) => {
                        //lookup to map w ktorym klucz to {day | time}
                        const slot = lookup.get(`${day}|${time}`);
                        // wyswietlaj heatmape niezaleznie od trybu
                        // heatmapa wyswietla sie na podstaie live result 
                        // osobiste zaznaczenie powinno miec ramke i checkboxa
                        // info slotu czyli count i imiona
                        const info = slot  ? result[slot] : undefined;
                        const count = info?.count ?? 0;
                        const pct = participantCount > 0 ? Math.round((count / participantCount) * 100) : 0;
                        const isSelected = !!slot && selectedSlots.has(slot)  
                            //czy koncowy termin spotkania został wybrany
                        const isFinal = !!slot && !!finalSlots?.has(slot)  
                        const isDraftFinal = variant === "final" && isSelected        
                        return (
                            <div
                                key={`${day}|${time}`}
                                title={info?.names.join(", ")}
                                // nie data-slot - tego atrybutu uzywaja komponenty shadcn (np. data-slot="card-content")
                                data-cell={slot}
                                // touch-none tylko na kafelkach w trybie edycji: przeciaganie palcem zaznacza,
                                // a dotyk w innym miejscu (godziny, naglowki) dalej przewija strone
                                className={`flex h-8 rounded-md border transition-colors justify-center items-center ${editable ? "cursor-pointer touch-none hover:opacity-80" : ""} ${(isSelected && variant==="availability") ? " ring-2 ring-primary ring-offset-1 ring-offset-background" : "" }`}
                                style={{
                                    backgroundColor: (isFinal || isDraftFinal)
                                        ? "var(--destructive)"
                                        : `color-mix(in oklab, var(--primary) ${pct}%, transparent)`,
                                }}                              >
                                {isSelected && <Check className="size-4 text-white" strokeWidth={3}/>}
                            </div>
                        );
                    })}
                </Fragment>
            ))}
        </div>
        </div>
        {/* min-h, zeby strona nie skakala, gdy pojawi sie pierwszy opis */}
        <p className="min-h-5 text-sm text-muted-foreground">
            {activeSlot && (
                <>
                    {new Date(activeSlot).toLocaleString("pl-PL", { timeZone, weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{activeInfo?.count ?? 0}/{participantCount}
                    {activeInfo && activeInfo.names.length > 0 && `: ${activeInfo.names.join(", ")}`}
                </>
            )}
        </p>
        </div>
    );
}
