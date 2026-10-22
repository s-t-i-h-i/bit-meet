import { parse } from 'date-fns';
import { tz } from '@date-fns/tz';

type Participant = { name: string; slots: string[] };
export type SlotInfo = { count: number; names: string[] };
type BestSlot = { start: string; end: string; count: number; names: string[] };


export function generateSlots(
    dates: string[],
    startTime: number, //minutes
    endTime: number, // minutes
    slotMinutes: number,//30
    timeZone: string
): string[]{

    // zmianiec date i godziny na utc 
    // czyli łączę date z godzinami co slotminutes i zamieniam na utc i dodaje do listy
    //moge iterowac klasycnymi petlami albo map.
    return dates.flatMap((date)=> {
        const slots: string[] = [];
        //zaczynamy od czasu poczatkowego
        for (let currentTime = startTime; currentTime + slotMinutes <= endTime; currentTime += slotMinutes) {
            const hours = Math.floor(currentTime / 60).toString().padStart(2, "0");
            const minutes = (currentTime % 60).toString().padStart(2, "0");

            // w obu ponizszych linijka liczba milisekund od 1970 roku jest taka sama - dlatego konwersja dziala 
            // interpretuje date + godzine w strefie z timeZone
            const localDate = parse(`${date} ${hours}:${minutes}`, "yyyy-MM-dd HH:mm", new Date(), { in: tz(timeZone) });
            // dodaje do listy w formacie ISO
            slots.push(new Date(localDate.getTime()).toISOString());
        }
        return slots;
    })
}

// dla kazdego slotu z listy sprawdzam ile osob ma w nim dostępność
export function aggregate(allSlots: string[], participants: Participant[]): Record<string, SlotInfo> {
const result: Record<string, SlotInfo> = {};

allSlots.forEach((slot) => {
    const slotInfo: SlotInfo = { count: 0, names: [] };

    participants.forEach((participant) => {
    if (participant.slots.includes(slot)) {
        slotInfo.count++;
        slotInfo.names.push(participant.name);
    }
    });

    result[slot] = slotInfo;
});

return result;
}

//TODO pozniej obslugs remisów
export function bestSlots(result: Record<string, SlotInfo>, slotMinutes: number, limit = 3): BestSlot[]{
    //pick the best slot based on the count of participants
    //{key,val} -> [key,val]
    return Object.entries(result)
    .filter(([, slotInfo]) => slotInfo.count > 0) // pozbadz sie elementow z count 0
    .sort(([, a], [, b]) => b.count - a.count) // posortuj malejaco po count,
    .slice(0,limit) // wez tylko limit najlepszych
    //iteracja po najlepszych slotach
    .map(([slot,slotInfo]) => {
        const start = slot;
        const endDate = new Date(new Date(slot).getTime() + slotMinutes * 60_000).toISOString();
        const count = slotInfo.count;
        const names = slotInfo.names;
        return { start, end: endDate, count, names };
    })
}