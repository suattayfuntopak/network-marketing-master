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

/** Phased migration — remove paths as each file moves to server actions. */
const supabaseClientTsxLegacy = {
  files: [
    "src/app/page.tsx",
    "src/app/(auth)/**/*.tsx",
    "src/app/(dashboard)/pipeline/**/*.tsx",
    "src/app/(dashboard)/pano/**/*.tsx",
    "src/app/(dashboard)/yazar/**/*.tsx",
    "src/components/ui/ProfileModal.tsx",
    "src/components/ui/SettingsModal.tsx",
    "src/components/ui/NotificationsModal.tsx",
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
