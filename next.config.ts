import type { NextConfig } from "next";

const buildId = (
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  "dev"
).slice(0, 7);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  experimental: {
    viewTransition: true,
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
