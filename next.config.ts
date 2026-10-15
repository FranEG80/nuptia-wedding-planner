import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // sharp 0.35 carga libvips en runtime. El trazado de Next puede incluir el
  // addon .node y omitir la biblioteca compartida a la que enlaza.
  outputFileTracingIncludes: {
    "/w/*": [
      "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/lib/**/*",
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
