import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// Plain TanStack Start config (previously wrapped by @lovable.dev/vite-tanstack-config,
// which only added Lovable-editor-specific dev tooling — none of it is needed once
// this project runs outside the Lovable sandbox). Deploy target is kept as
// Cloudflare Workers via nitro's cloudflare-module preset, matching the original setup.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    nitro({ defaultPreset: "vercel", inlineDynamicImports: true }),
    viteReact(),
  ],
});
