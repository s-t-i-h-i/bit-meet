"use client"
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Content() {
  const dni = useSearchParams().get("dni")?.split(",").filter(Boolean) ?? [];
  return (
    <main className="flex flex-col items-start gap-4 p-16">
      <h1>Rezerwacja</h1>
      {dni.length > 0 ? (
        <ul>
          {dni.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : (
        <p>Brak wybranych dni.</p>
      )}
      <Link href="/" className="text-blue-500 underline">Wróć</Link>
    </main>
  );
}

export default function Rezerwacja() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
