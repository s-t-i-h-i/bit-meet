// lib/sampleData.ts

// Podstawowy: 3 dni, 9:00–13:00, sloty 30 min
export const basic = {
dates: ["2026-10-27", "2026-10-28", "2026-10-29"],
startTime: 9 * 60,   // 540
endTime: 13 * 60,    // 780
slotMinutes: 30,
timeZone: "Europe/Warsaw",
};

// Zmiana czasu 25.10 (z letniego na zimowy)
export const dstChange = {
dates: ["2026-10-24", "2026-10-25", "2026-10-26"],
startTime: 9 * 60,
endTime: 11 * 60,
slotMinutes: 30,
timeZone: "Europe/Warsaw",
};

// Slot, który nie dzieli przedziału równo
export const uneven = {
dates: ["2026-10-27"],
startTime: 9 * 60,
endTime: 11 * 60,
slotMinutes: 45,
timeZone: "Europe/Warsaw",
};

// Duża siatka: cały tydzień, 8:00–20:00 (test przewijania i telefonu)
export const fullWeek = {
dates: [
    "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05",
    "2026-11-06", "2026-11-07", "2026-11-08",
],
startTime: 8 * 60,
endTime: 20 * 60,
slotMinutes: 30,
timeZone: "Europe/Warsaw",
};

// Brak dni
export const empty = {
dates: [],
startTime: 9 * 60,
endTime: 13 * 60,
slotMinutes: 30,
timeZone: "Europe/Warsaw",
};