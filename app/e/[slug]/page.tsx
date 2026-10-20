import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation"
import { generateSlots } from "@/app/components/helpers";
import { hashToken } from "@/lib/tokens";
import { cookies } from "next/headers";



// params to promise dlatego async
export default async function EventPage({ params }: PageProps<"/e/[slug]">) {
    const { slug } = await params;

    // zdobac dane wydarzenia z bazy danych
    const event = await prisma.event.findUnique({where: {slug}})
    if (!event){
        notFound();
    }

    //wygenerowanie listy slotów na podstawie danych z database
    const dates = JSON.parse(event.dates) as string[];
    const slots = generateSlots(dates, event.startMinutes, event.endMinutes, event.slotMinutes, event.timeZone);
    
    // sprawdz czy to zalozyciel wydarzenia (cookie z tokenem admina)
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(`admin_${slug}`)?.value;
    const isAdmin =  adminToken !== undefined && hashToken(adminToken) === event.adminTokenHash;


    return (
        <main>
        <h1>{event.name}</h1>
        {isAdmin && <p>Jesteś twórcą tego wydarzenia.</p>}

        <h2>Sloty ({slots.length})</h2>
        <ul>
            {slots.map((slot) => (
            <li key={slot}>{slot}</li>
            ))}
        </ul>
        </main>
    );
}
