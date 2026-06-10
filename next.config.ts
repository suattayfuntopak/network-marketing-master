import type { NextConfig } from "next";

const buildId = (
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  "dev"
).slice(0, 7);

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  experimental: {
    viewTransition: true,
    // lucide-react 120+ dosyada import ediliyor — barrel import yerine
    // ikon-başına otomatik tree-shake; client bundle'ını küçültür (daha hızlı
    // JS indir/parse → sayfa/sekme geçişleri "pat pat").
    optimizePackageImports: ['lucide-react'],
    // Client router cache: dinamik segmentlerin RSC payload'unu kısa süre sakla
    // → aynı sekmeye/geri dönüşte middleware(getUser ~320ms)+RSC yeniden
    // çekilmez, anında geçer. Veri tazeliği TanStack staleTime'larıyla korunur.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async redirects() {
    return [
      {
        source: "/itirazlar",
        destination: "/egitim?tab=objections",
        permanent: true,
      },
      {
        source: "/saha-provasi",
        destination: "/yazar?tab=prova",
        permanent: true,
      },
      {
        source: "/uyum",
        destination: "/yazar?tab=uyum",
        permanent: true,
      },
      {
        source: "/egitim/videolar",
        destination: "/egitim?tab=videos",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
