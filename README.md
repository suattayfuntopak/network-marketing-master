# Network Marketing Master (NMM)

A premium, AI-assisted CRM and coaching platform for network-marketing leaders and
their teams. Leaders manage a candidate pipeline, run their downline ("Ekibim"),
track each distributor's "correct start" onboarding, and generate AI messages,
roleplays and compliance checks — all bilingual (Turkish / English).

**Slogan:** *Alanında öncü, basit, kullanıcı dostu, işlevsel ve aynı zamanda son derece profesyonel ve premium bir uygulama.*

## Tech stack

- **Next.js 16** (App Router, Server Actions) — note: this is a newer Next than most
  training data; read `node_modules/next/dist/docs/` before changing framework code.
- **React 19** + **Tailwind CSS 4**
- **Supabase** — Postgres, Auth, RLS, RPC functions (`src/lib/infra/supabase`)
- **TanStack Query** for client data/cache
- **Google Generative AI** (Gemini) for message/roleplay/coaching generation
- **Resend** for transactional email · **Shopier** for payments

## Core domain

- **Pipeline (`/pipeline`)** — candidate stages: `yeni → iletisim → davetli → sunum → takip → katildi`.
- **Ekibim (`/ekip`)** — sponsor + downline members; invite-code onboarding; 4-week
  "Distribütör Doğru Başlangıç Rehberi"; AI team coach.
- **İstatistikler / Platform Yönetim** — team performance, AI usage & limits, and the
  app-owner's platform admin desk (license management).
- **AI quota & licenses** — `free` / `leader` / `pro` / `master`; per-license daily
  limits via `getLimitsForLicense` (`src/lib/domain/aiUsage.ts`).

### Super admin = real user + app owner

The `SUPER_ADMIN_EMAIL` user is both the platform owner (unlimited AI, Platform
Yönetim access) **and** a normal leader running their own real team. There is no
separate "test/bypass" path — what works for them works for everyone; only the
quota (unlimited) and platform-admin access differ. See `CLAUDE.md` for the full rules.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck + lint
npm run lint
```

Create `.env.local` with (at minimum):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
SHOPIER_API_KEY=...   # veya legacy: SHOPIER_API_USER
SHOPIER_API_SECRET=...
SHOPIER_WEBSITE_INDEX=1   # Shopier panelindeki site numarası (varsayılan 1)
```

## Project structure

```
src/
  app/(dashboard)/   in-app routes (pano, pipeline, ekip, istatistikler, ...)
  app/(auth)/        login / signup / password reset
  app/api/           ONLY external callers: webhooks, cron, public AI
  components/ui/     shared UI primitives (Skeleton, modals, ...)
  hooks/             React Query hooks (useCandidates, useTeamMembers, ...)
  lib/
    infra/  supabase, ai, mail
    domain/ stages, aiUsage, navigation, trainingData
    utils/  noteParser, validation, waLink, getLang
    ui/     zIndex, deleteWithUndo
    team/ query/ translations/
  types/             database.types.ts (generated) + domain types
supabase/migrations/ numbered SQL migrations (one number = one migration)
```

## Conventions

- **Server Actions by default**; API routes only for external HTTP callers (see `AGENTS.md`).
- **Migrations:** one number = one migration, never edit an applied one — see
  `supabase/migrations/README.md`. Update `src/types/database.types.ts` after schema changes.
- **i18n:** all user-visible copy via `useTranslation()` keys in `src/lib/translations`.
- Full agent/contributor rules: [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md).
- Recent changes & deploy notes: [`hot.md`](hot.md).
