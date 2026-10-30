import Image from "next/image";
import DatePicker, { CreateEventButton, SelectedDatesProvider } from "./components/createEventForm";
import { createEvent } from "./actions";
import { Gradient } from "@/components/ui/gradient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SLOT_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "60 min" },
];

// odcienie pomaranczu dla 5 plam gradientu 
const GRADIENT_COLORS = [
  "oklch(0.83 0.12 70)",
  "oklch(0.72 0.18 50)",
  "oklch(0.78 0.16 80)",
  "oklch(0.65 0.2 40)",
  "oklch(0.75 0.17 60)",
];

export default function Home() {
  return (
    <Gradient colors={GRADIENT_COLORS} className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16">
        <h1 className="flex items-end justify-center gap-4">
          <Image src="/logo.png" alt="BIT" width={1800} height={874} priority className="h-24 w-auto dark:invert" />
          {/* leading-none + translate: baseline liter na dole kropek loga (PNG ma ~4% bialego marginesu) */}
          <span className="font-[family-name:var(--font-logo)] translate-y-[0.065em] text-7xl leading-none">meet</span>
        </h1>

        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Nowe wydarzenie</CardTitle>
            <CardDescription>Wybierz dni i godziny, a resztę zaznaczą uczestnicy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createEvent} className="flex flex-col gap-5">
              <SelectedDatesProvider>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nazwa</Label>
                  <Input id="name" type="text" name="name" required />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Dni</Label>
                  <DatePicker />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="startTime">Od godziny</Label>
                    <Input id="startTime" type="time" name="startTime" defaultValue="09:00" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="endTime">Do godziny</Label>
                    <Input id="endTime" type="time" name="endTime" defaultValue="17:00" required />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="slotMinutes">Długość slotu</Label>
                  <Select name="slotMinutes" defaultValue="30" items={SLOT_OPTIONS}>
                    <SelectTrigger id="slotMinutes" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TODO: strefa czasowa na razie stala "Europe/Warsaw" (w actions.ts) */}
                <CreateEventButton>Utwórz wydarzenie</CreateEventButton>
              </SelectedDatesProvider>
            </form>
          </CardContent>
        </Card>
      </main>
    </Gradient>
  );
}
