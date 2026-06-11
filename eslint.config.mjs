import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noSupabaseClientInTsx = {
  files: ["src/**/*.tsx"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/lib/supabase/client",
            message:
              "Do not use createClient() in TSX — use server actions or TanStack hooks.",
          },
        ],
      },
    ],
  },
};

/**
 * KALICI istisnalar — tarayıcıya özgü Supabase auth API'leri kullanan dosyalar.
 * `signInWithPassword` (cookie/oturum istemcide yazılır), `onAuthStateChange`
 * (yalnızca tarayıcıda var) ve URL hash'ten `setSession` (recovery token yalnız
 * tarayıcıya ulaşır) server action'a taşınamaz. Veri okuma/yazma yapan tüm
 * legacy dosyalar server action'a taşındı (2026-06-11) — yeni dosya EKLEME.
 */
const supabaseClientTsxLegacy = {
  files: [
    "src/app/(auth)/giris/_components/LoginForm.tsx",
    "src/app/(auth)/sifre-guncelle/_components/PasswordResetGate.tsx",
    "src/app/_components/landing/LandingPage.tsx",
  ],
  rules: {
    "no-restricted-imports": "off",
  },
};

/** `_` önekli parametre = bilinçli kullanılmayan (API yüzeyi korunur). */
const underscoreArgsAllowed = {
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};

const noRawZIndex = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/lib/ui/zIndex.ts"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/\\bz-\\[/]",
        message: "Use Z.* from @/lib/ui/zIndex instead of raw z-[NN].",
      },
      {
        selector: "Literal[value=/\\bz-(?!\\[)\\d+\\b/]",
        message: "Use Z.* from @/lib/ui/zIndex instead of raw z-NN.",
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noSupabaseClientInTsx,
  supabaseClientTsxLegacy,
  underscoreArgsAllowed,
  noRawZIndex,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Geçici geliştirici scriptleri — lint kapsamı dışında
    "scratch/**",
  ]),
]);

export default eslintConfig;
