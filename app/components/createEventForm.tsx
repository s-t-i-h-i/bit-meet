"use client"
import { format } from "date-fns";
import { pl } from "react-day-picker/locale";
import { createContext, useContext, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

// wspolny stan wybranych dni dla kalendarza i przycisku (page.tsx jest server componentem)
const SelectedDatesContext = createContext<{
    selected: Date[];
    setSelected: (dates: Date[]) => void;
} | null>(null);

function useSelectedDates() {
    const ctx = useContext(SelectedDatesContext);
    if (!ctx) throw new Error("useSelectedDates musi byc w <SelectedDatesProvider>");
    return ctx;
}

export function SelectedDatesProvider({ children }: { children: React.ReactNode }) {
    const [selected, setSelected] = useState<Date[]>([]);
    return (
        <SelectedDatesContext.Provider value={{ selected, setSelected }}>
            {children}
        </SelectedDatesContext.Provider>
    )
}

export function CreateEventButton({ children }: { children: React.ReactNode }) {
    const { selected } = useSelectedDates();
    return (
        <Button type="submit" size="lg" className="mt-2 h-10 w-full" disabled={selected.length === 0}>
            {children}
        </Button>
    )
}

export default function DatePicker(){
    const { selected, setSelected } = useSelectedDates();

    return (
        <>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-2">
                <Calendar
                    mode="multiple"
                    locale={pl}
                    selected={selected}
                    disabled={{ before: new Date() }}
                    onSelect={(dates) => setSelected(dates ?? [])}
                />
                <p className="text-sm text-muted-foreground">
                    {selected.length > 0 ? `Wybrane dni: ${selected.length}` : "Wybierz dni."}
                </p>
            </div>
            <input
                type="hidden"
                name="dates"
                value={selected.map((d) => format(d, "yyyy-MM-dd")).join(",")}
            />
        </>
    )
}
