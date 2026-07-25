# KOSEN-APP

A campus companion PWA — housing/reservations, real-time alerts, and a community feed — installable on Android, iOS, and Windows, with full offline support.

## Tech Stack

**Frontend & UI**
- [Next.js](https://nextjs.org/docs) (App Router, TypeScript)
- [shadcn/ui](https://ui.shadcn.com/) — accessible UI primitives built on Radix
- [Tailwind CSS](https://tailwindcss.com/docs) — utility-first styling

**Backend & Database**
- [Supabase](https://supabase.com/docs) (PostgreSQL, Auth, Realtime)
- [Drizzle ORM](https://orm.drizzle.team/) — type-safe SQL, schema-as-code

**PWA & Push**
- [Serwist](https://serwist.pages.dev/) (`@serwist/next`) — service worker generation, precaching, offline fallback
- Web Push (VAPID) — cross-platform push notifications

**Hosting**
- [Vercel](https://vercel.com/) — serverless deployment (frontend + API routes together, no separate backend)

## Project Structure

```
kosen-app/
  src/
    app/
      page.tsx           # public homepage (install prompt lives here)
      offline/           # offline fallback page (ungated — reachable anytime)
      sw.ts              # Serwist service worker source
      (app)/              # route group — gated behind PWA install check
        layout.tsx         # applies RequireStandalone wrapper
        ...                # protected feature pages (reservations, etc.)
    components/
    lib/
    db/
      client.ts           # Drizzle client
      schema.ts            # Drizzle schema definitions
  public/
    manifest.json
    icons/                # app icons incl. maskable variant
  drizzle/                # generated SQL migrations
  .github/
    workflows/
      ci.yml               # lint, build, secret scanning
```

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com), free tier)

### Setup

```bash
cd kosen-app
npm install
```

Copy the env template and fill in real values (see **Environment Variables** below):

```bash
cp .env.example .env.local
```

Run the dev server:

```bash
npm run dev
```

App runs at `http://localhost:3000`. Note: the service worker is **disabled in dev mode** — see **Testing PWA Behavior** below for how to verify install/offline/push functionality.

## Environment Variables

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Client-side Supabase key (access governed by RLS) |
| `SUPABASE_SECRET_KEY` | **No** | Server-only, bypasses RLS — only add if a feature needs it |
| `DATABASE_URL` | **No** | Direct Postgres connection string for Drizzle (use the **pooled** connection — port `6543` — in production) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | Client-side push subscription key |
| `VAPID_PRIVATE_KEY` | **No** | Signs outgoing push messages |
| `VAPID_SUBJECT` | Yes | Contact URL/email for push services |

Generate VAPID keys once per project (not per developer):

```bash
npx web-push generate-vapid-keys
```

**Never commit `.env.local`.** Secrets marked "No" above go through a private channel (password manager) only — see the git workflow checklist for verification steps.

## Database (Drizzle)

```bash
npm run generate       # generate SQL migration from schema.ts
npm run migrate        # apply migrations to the database
```

Schema lives in `src/db/schema.ts`; query/mutation logic should live in `src/lib/` (not inline in route handlers), so both Route Handlers and Server Actions can share it.

## Testing PWA Behavior

The service worker only runs in a **production build** — `npm run dev` skips it entirely.

```bash
npm run build   # runs webpack (required for Serwist)
npm run start
```

Then in Chrome DevTools → **Application** tab:
1. **Service Workers** — should show "activated and is running"
2. **Cache Storage** — expand `serwist-precache-v2-...`, confirm app assets are listed
3. **Offline test** — check the "Offline" checkbox in the Service Workers panel, then navigate to an already-cached route or a route with a broken network request — should show the custom `/offline` page

Install-gating (routes under `(app)/`) should redirect to `/` in a regular browser tab, and only render once opened from an installed/home-screen app instance.

## Adding Shadcn Components

```bash
npx shadcn@latest add <your-component>
```

## Testing Database Integration 

```bash
npx tsx src/db/test-conntection.ts
```

## CI

`.github/workflows/ci.yml` runs on every PR to `main`/`dev`:
- Lint
- Build (`--webpack`, required — Serwist doesn't support Turbopack yet)
- Secret scanning (gitleaks)

## Contributing

- Branch off `dev`, not `main`: `git checkout -b feature/your-feature dev`
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`)
- Open PRs against `dev`; `main` is protected and requires passing CI
