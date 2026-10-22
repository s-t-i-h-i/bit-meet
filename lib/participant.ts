import "server-only"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"

// nie w actions bo to funkcja ktora ma byc dostepna tylko w serwerze.
//actions ma endpointy ktore gdy uzyte na frontend moga byc dostepne dla kazdego

export async function getCurrentParticipant(eventId: string, slug: string): Promise<{ id: string; name: string } | null>{
    const store = await cookies()
    const token = store.get(`p_${slug}`)?.value
    if (!token) return null
    const tokenHash = hashToken(token)
    const participant = await prisma.participant.findFirst({
        where: {eventId, tokenHash},
        select: {id: true, name: true}
    })
    return participant    
}

// tworca: cookie admin_${slug} -> hash -> porownanie z hashem zapisanym w wydarzeniu
export async function isAdmin(event: { slug: string; adminTokenHash: string }): Promise<boolean> {
    const store = await cookies()
    const token = store.get(`admin_${event.slug}`)?.value
    if (!token) return false
    return hashToken(token) === event.adminTokenHash
}

// wspolny poczatek akcji uczestnika: wydarzenie po slugu + uczestnik z cookie
export async function requireParticipant(slug: string) {
    const event = await prisma.event.findUnique({ where: { slug } })
    if (!event) return { error: "Nie znaleziono wydarzenia" } as const

    const participant = await getCurrentParticipant(event.id, slug)
    if (!participant) return { error: "Najpierw podaj imię" } as const

    return { event, participant } as const
}
