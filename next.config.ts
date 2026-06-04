import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
