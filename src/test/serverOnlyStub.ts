// vitest, Next'in `server-only` paketini çözemez (Next runtime'ı sağlar).
// Testlerde no-op olarak alias'lanır (vitest.config.ts) — davranışı etkilemez,
// yalnızca import çözümlenir. Bkz. authUser.ts `import 'server-only'`.
export {}
