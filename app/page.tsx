import DatePicker from "./components/createEventForm";
import { createEvent } from "./actions";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1> BIT MEET</h1>
        <form action={createEvent} className="flex flex-col gap-4">
          <label className="flex flex-col">
            Nazwa
            <input type="text" name="name" required className="border rounded px-2 py-1" />
          </label>
          <DatePicker />
          <label className="flex flex-col">
            Od godziny
            <input type="time" name="startTime" defaultValue="09:00" required className="border rounded px-2 py-1" />
          </label>
          <label className="flex flex-col">
            Do godziny
            <input type="time" name="endTime" defaultValue="17:00" required className="border rounded px-2 py-1" />
          </label>
          <label className="flex flex-col">
            Dlugosc slotu
            <select name="slotMinutes" defaultValue="30" className="border rounded px-2 py-1">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </label>
          {/* TODO: strefa czasowa na razie stala "Europe/Warsaw" (w actions.ts) */}
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Utworz wydarzenie
          </button>
        </form>
      </main>
    </div>
  );
}
