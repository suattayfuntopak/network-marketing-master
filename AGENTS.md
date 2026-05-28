<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI conventions (NMM)

### Loading states
- **Route-level:** `src/app/(dashboard)/loading.tsx` renders `DashboardLoading` while dashboard segments load.
- **In-page:** Prefer `<Skeleton className="..." />` from `@/components/ui/Skeleton` over ad-hoc `animate-pulse` divs.

### z-index
- Use `import { Z } from '@/lib/zIndex'` and `Z.confirm`, `Z.sheet`, `Z.fullscreen`, etc.
- Do **not** add new raw Tailwind `z-[NN]` classes; extend `zIndex.ts` if a new layer is needed.

### i18n
- User-visible copy: `useTranslation()` → `t('section.key', { vars })`.
- Avoid `lang === 'en' ? ... : ...` in components; add keys to `src/lib/translations/tr.ts` and `en.ts`.
