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
 * Phased migration — exact file allowlist (NOT wildcards). Her dosya server
 * action'a taşındıkça listeden silinir; yeni eklenen dosyalar bu istisnaya
 * otomatik girmez, dolayısıyla borç ölçülebilir ve azalan kalır.
 */
const supabaseClientTsxLegacy = {
  files: [
    "src/app/(auth)/giris/_components/LoginForm.tsx",
    "src/app/(auth)/sifre-guncelle/_components/PasswordResetGate.tsx",
    "src/app/(dashboard)/pano/_components/OnboardingModal.tsx",
    "src/app/(dashboard)/pipeline/_components/AddCandidateSheet.tsx",
    "src/app/(dashboard)/pipeline/_components/EditCandidateSheet.tsx",
    "src/app/(dashboard)/yazar/_components/YazarForm.tsx",
    "src/app/_components/landing/LandingPage.tsx",
    "src/components/ui/NotificationsModal.tsx",
    "src/components/ui/ProfileModal.tsx",
    "src/components/ui/SettingsModal.tsx",
  ],
  rules: {
    "no-restricted-imports": "off",
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
  noRawZIndex,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
