"use client"
import { useMemo, useState } from "react";
import AvailabilityGrid from "../components/availabilityGrid";
import { generateSlots } from "@/app/components/helpers";
import { basic } from "@/lib/sampleData";

export default function DevPage() {
  const s = basic;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const slots = useMemo(
    () => generateSlots(s.dates, s.startTime, s.endTime, s.slotMinutes, s.timeZone),
    [s]
  );

  return (
    <main className="p-8">
      <AvailabilityGrid
        slots={slots}
        timeZone={s.timeZone}
        selectedSlots={selected}
        setSelectedSlots={setSelected}
        mode="edit"
      />
    </main>
  );
}
