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

// Tek `no-restricted-syntax` bloğu — flat config'te aynı kural birden çok blokta
// tanımlanırsa sonuncusu öncekini EZER, bu yüzden tüm seçiciler burada toplanır.
const noRestrictedSyntax = {
  files: ["src/**/*.{ts,tsx}"],
  // zIndex.ts ham z-[ değerlerini TANIMLAR; waLink.ts wa.me/?text= helper'ını
  // BARINDIRIR — ikisi de kendi kuralından muaf.
  ignores: ["src/lib/ui/zIndex.ts", "src/lib/utils/waLink.ts"],
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
      {
        // `created_at.slice(0,10)` UTC gününü verir → gece 00:00–03:00 yanlış güne
        // düşer. Gün anahtarı için istanbulDayKey() (lib/utils/calendarDates) kullan.
        selector: "CallExpression[callee.object.property.name='created_at'][callee.property.name='slice']",
        message: "created_at.slice(0,10) UTC günü verir; İstanbul günü için istanbulDayKey() (lib/utils/calendarDates) kullan.",
      },
      {
        // Ham WhatsApp paylaşım URL'i (alıcısız) — `whatsappShareUrl()` kullan.
        selector: "TemplateElement[value.raw=/(?:api\\.whatsapp\\.com\\/send|wa\\.me\\/\\?text=)/]",
        message: "Ham WhatsApp paylaşım URL'i kurma; whatsappShareUrl() (lib/utils/waLink) kullan.",
      },
      {
        selector: "Literal[value=/(?:api\\.whatsapp\\.com\\/send\\?text=|wa\\.me\\/\\?text=)/]",
        message: "Ham WhatsApp paylaşım URL'i kurma; whatsappShareUrl() (lib/utils/waLink) kullan.",
      },
      {
        // `supabase.auth.getUser()` HER çağrıda Supabase auth sunucusuna ~230ms
        // ağ gidiş-dönüşü yapar. getClaims tabanlı yardımcılar asimetrik JWT'yi
        // YEREL doğrular (~0ms) ve cache()'ler. Server: getAuthUser()
        // (lib/supabase/authUser); Client/hook: getClientUserId()
        // (lib/supabase/authUserClient). Bkz. docs/performance.md §8.
        selector: "CallExpression[callee.object.property.name='auth'][callee.property.name='getUser']",
        message: "Ham supabase.auth.getUser() (~230ms auth round-trip) yasak. Server'da getAuthUser() (lib/supabase/authUser), client'ta getClientUserId() (lib/supabase/authUserClient) kullan.",
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
  noRestrictedSyntax,
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
