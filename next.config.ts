import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // El reporte PAC (Anexo B-02-02) rellena el template oficial en
  // src/lib/reportes/templates — este asset binario no se detecta solo por el
  // file tracing de Next, hay que declararlo explícitamente para que Vercel lo
  // incluya en el bundle de la función serverless de esa ruta.
  outputFileTracingIncludes: {
    "/api/reportes/pac/[id]/route": ["./src/lib/reportes/templates/**"],
  },
};

export default nextConfig;
