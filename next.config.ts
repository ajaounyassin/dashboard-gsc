import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recharts utilise des imports dynamiques, évite les warnings SSR
  transpilePackages: ["recharts"],
  // Variables d'env exposées côté serveur uniquement (sécurité)
  env: {},
  experimental: {
    // Améliore les performances du bundle
    optimizePackageImports: ["recharts", "lucide-react"],
  },
};

export default nextConfig;
