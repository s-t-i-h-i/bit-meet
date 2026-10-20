"use server"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";

const MAX_DAYS = 31;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

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
  if (!name || name.length > 100) throw new Error("Niepoprawna nazwa");
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
