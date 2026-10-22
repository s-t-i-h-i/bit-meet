"use server"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { generateSlots } from "@/app/components/helpers";
import { requireParticipant } from "@/lib/participant";

const MAX_DAYS = 31;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

type JoinState = { error: string | null };


export async function createEvent(formData: FormData) {
  //to send
  const name = String(formData.get("name") ?? "").trim();
  const dates = [...new Set(String(formData.get("dates") ?? "").split(",").filter(Boolean))].sort();
  const startMinutes = toMinutes(String(formData.get("startTime")));
  const endMinutes = toMinutes(String(formData.get("endTime")));
  const slotMinutes = Number(formData.get("slotMinutes"));
  const timeZone = "Europe/Warsaw"; // TODO: strefa czasowa wybierana przez uzytkownika/automatycznie wykrywana

  //walidacja wartości
  // Server Action to publiczny POST - walidacja musi byc tu, nie tylko w formularzu
  if (!name || name.length > 100) throw new Error("Podaj imię (1–30 znaków)");
  if (dates.length === 0 || dates.length > MAX_DAYS || !dates.every((d) => DATE_RE.test(d))) {
    throw new Error("Niepoprawne daty");
  }
  if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes) || !(endMinutes > startMinutes)) {
    throw new Error("Koniec musi byc pozniej niz poczatek");
  }
  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) throw new Error("Niepoprawna dlugosc slotu");

  // losowy token
  const token = generateToken();
  const adminTokenHash = hashToken(token);
  const slug = nanoid(10);

  // zapis w bazie danych
  await prisma.event.create({
    data: {
      slug,
      name,
      dates: JSON.stringify(dates),
      startMinutes,
      endMinutes,
      slotMinutes,
      timeZone,
      adminTokenHash,
    },
  });

  (await cookies()).set(`admin_${slug}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // redirect dziala przez rzucenie wyjatku - musi byc poza try/catch
  redirect(`/e/${slug}`);
}


export async function joinEvent(
  slug: string,
  _prevState: JoinState,//Wynik poprzedniego wywołania tej samej akcji
  formData: FormData // pola formularza jako pary nazwa → wartość.
): Promise<JoinState> {

  // znajdz wydarzenie po slug
  const event = await prisma.event.findUnique({
    where: {slug}
  })
  if (!event) {
    return { error: "Nie znaleziono wydarzenia"}
  }

  const name = String(formData.get("name") ?? "").trim()
  if (name.length === 0 || name.length >30){
    return { error: "Podaj imię (1–30 znaków)"}
  }
  //czy imie zajete w tym wydarzeniu
  const existingParticipant = await prisma.participant.findFirst({
    where: {eventId: event.id, name}
  })
  if (existingParticipant) {
    return { error: "Ta nazwa jest juz zajęta w tym wydarzeniu"}
  }

  // nowy token dla uczestnika
  const token = generateToken()
  const tokenHash = hashToken(token);

  // najpierw zapis w bazie - jak sie nie uda, cookie nie powstaje
  await prisma.participant.create({
    data: { eventId: event.id, name, tokenHash },
  });

  // Cookie p_${slug} z tokenem (te same opcje co cookie admina)
  (await cookies()).set(`p_${slug}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // odswiez strone, zeby serwer zobaczyl nowe cookie i uczestnika
  revalidatePath(`/e/${slug}`);
  return { error: null };
}

//przy każdym wejściu na stronę ustalić, który wiersz z tabeli Participant należy do tej przeglądarki. Bez kont jedynym „dowodem” jest token w cookie


type SaveState = { error?: string; ok?: true };

export async function saveAvailability(slug: string, slots: string[]): Promise<SaveState> {
  const auth = await requireParticipant(slug);
  if ("error" in auth) return { error: auth.error };
  const { event, participant } = auth;

  // Server Action to publiczny POST - argumenty moga byc czymkolwiek
  if (!Array.isArray(slots) || !slots.every((s) => typeof s === "string")) {
    return { error: "Niepoprawne dane" };
  }

  // tylko sloty nalezace do wydarzenia, bez duplikatow
  const allowed = new Set(
    generateSlots(JSON.parse(event.dates) as string[], event.startMinutes, event.endMinutes, event.slotMinutes, event.timeZone)
  );
  const clean = [...new Set(slots)].filter((s) => allowed.has(s));

  // transakcja: jak zapis nowych sie nie uda, usuniecie starych jest cofniete
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { participantId: participant.id } }),
    prisma.availability.createMany({
      data: clean.map((slot) => ({ participantId: participant.id, slot })),
    }),
  ]);

  revalidatePath(`/e/${slug}`);
  return { ok: true };
}
