# BIT Meet

Aplikacja do ustalania wspólnego terminu spotkania, w stylu When2meet. Twórca tworzy wydarzenie, uczestnicy zaznaczają swoją dostępność, a aplikacja pokazuje najlepszy termin spotkania, z możliwością jego wybrania i poinformowania wszystkich użytkowników. Przy tworzeniu projektu był używany Claude.

## Funkcje
- Tworzenie wydarzenia: daty, zakres godzin, długość slotu. Unikalny link do wydarzenia
- Dołączanie bez konta: uczestnik podaje tylko imię.
- Siatka dostępności: zaznaczanie kliknięciem lub przeciąganiem.
- Heatmapa: im ciemniejsze pole, tym więcej osób jest dostępnych w danym terminie. Lista najlepszych terminów.
- Edycja: uczestnik może zmienić/usunąć swoją dostępność albo opuścić wydarzenie.
- Panel twórcy: usuwanie uczestników. Wybór ostatecznego terminu spotkania

## Technologie
- Next.js (App Router) +  Typescript
- Prisma + SQLite
- Tailwind CSS

## Uruchomienie

**Wymagany Node.js 20+.**

```bash
npm install
cp .env.example .env      # DATABASE_URL="file:./dev.db"
npx prisma migrate dev    
npm run dev
```

Aplikacja działa pod adresem http://localhost:3000.

