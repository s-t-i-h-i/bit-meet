"use client"
import { Fragment, useEffect, useMemo, useRef } from "react"
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
};

export default function AvailabilityGrid({ slots, timeZone, mode, selectedSlots = new Set(), setSelectedSlots, result, participantCount = 0 }: Props) {
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
            ?.closest<HTMLElement>("[data-slot]")?.dataset.slot

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

    // 4. CSS Grid wypelnia wierszami: petla zewnetrzna po godzinach, wewnetrzna po dniach
    return (
        <div
            className="grid gap-1 touch-none select-none text-sm"
            onPointerDown={editable ? handlePointerDown : undefined}/*gdy uytkownik naciśnie nad tabelą */
            onPointerMove={editable ? handlePointerMove : undefined}/*aktywacja gdy kursor zmienia swoje polozenie*/
            style={{ gridTemplateColumns: `auto repeat(${days.length}, 1fr)` }}
        >
            <div />
            {days.map((day) => (
                //dla kazdego dnia zbuduj nagłówek z jego datą
                <div key={day} className="text-center font-medium">{day}</div>
            ))}
            {times.map((time) => (
                //dla kazdej godziny 
                <Fragment key={time}>
                    {/*pierwsza kolumna to napisana godzina */}
                    <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">{time}</div>
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
                        return (
                            <div
                                key={`${day}|${time}`}
                                title={info?.names.join(", ")}
                                data-slot={slot}
                                className={`flex h-8 rounded-md border transition-colors justify-center items-center ${editable ? "cursor-pointer" : ""} ${isSelected ? " ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:bg-muted" }`}
                                style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${pct}%, transparent)` }}
                            >
                            {isSelected && <Check className="size-4 text-white" strokeWidth={3}/>}
                            </div>
                        );
                    })}
                </Fragment>
            ))}
        </div>
    );
}
