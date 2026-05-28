<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI conventions (NMM)

### Loading states
- **Route-level:** `src/app/(dashboard)/loading.tsx` renders `DashboardLoading` while dashboard segments load.
- **In-page:** Prefer `<Skeleton className="..." />` from `@/components/ui/Skeleton` over ad-hoc `animate-pulse` divs.

### z-index
- Use `import { Z } from '@/lib/ui/zIndex'` and `Z.confirm`, `Z.sheet`, `Z.fullscreen`, etc.
- Do **not** add new raw Tailwind `z-[NN]` classes; extend `zIndex.ts` if a new layer is needed.

### i18n
- User-visible copy: `useTranslation()` → `t('section.key', { vars })`.
- Avoid `lang === 'en' ? ... : ...` in components; add keys to `src/lib/translations/tr.ts` and `en.ts`.

## Architecture conventions (NMM)

### Supabase client in components
- **Do not** import `@/lib/supabase/client` in `.tsx` files (ESLint enforced). Mutations → server actions; reads → TanStack hooks or server actions.
- Legacy exceptions are listed in `eslint.config.mjs` (`supabaseClientTsxLegacy`) until migrated.

### API routes vs Server Actions
- **Server Actions (default):** all in-app mutations/queries triggered by the UI. Co-locate as `actions.ts` in the route folder (e.g. `src/app/(dashboard)/<route>/actions.ts`). Shared dashboard actions live in `src/app/(dashboard)/_shared-actions.ts`.
- **API routes (`src/app/api/**`) are ONLY for external HTTP callers:** webhooks (Shopier), cron jobs, and public/unauthenticated AI endpoints. If something has no external caller, it must be a server action, not an API route.

### `lib/` taxonomy
- `lib/infra/` — external systems (supabase, ai, mail)
- `lib/utils/` — pure helpers (noteParser, validation, waLink, getLang)
- `lib/domain/` — business rules (stages, aiUsage, navigation, trainingData)
- `lib/ui/` — UI primitives/helpers (zIndex, deleteWithUndo)
- `lib/team/`, `lib/query/`, `lib/translations/` — feature/cross-cutting modules
- Do not add new flat files at `lib/` root; place them in the matching group.

### Migrations
- One number = one migration; never edit an already-applied migration — add the next number. See `supabase/migrations/README.md`.
- After schema changes, update `src/types/database.types.ts`.
