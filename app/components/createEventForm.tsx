"use client"
import { DayPicker } from "@daypicker/react";
import { format } from "date-fns";
import {useState} from "react";
import "@daypicker/react/style.css";

export default function DatePicker(){
    const [selected, setSelected] = useState<Date[]>([]);

    return (
        <>
            <DayPicker
                animate
                mode="multiple"
                selected={selected}
                disabled={{ before: new Date() }}
                onSelect={(dates) => setSelected(dates ?? [])}
                footer={
                selected.length > 0
                    ? `Wybrane dni: ${selected.length}`
                    : "Wybierz dni."
                }
            />
            <input
                type="hidden"
                name="dates"
                value={selected.map((d) => format(d, "yyyy-MM-dd")).join(",")}
            />
        </>
    )
}
