// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// On Vercel, pin the nitro preset so the build emits Vercel's expected output.
// Inside Lovable builds the platform pins its own preset and this stays undefined.
const isVercel = !!process.env["VERCEL"];

export default defineConfig({
  // `inlineDynamicImports` isn't in this package's TS types yet, but nitro/rollup
  // both accept it at runtime — it's required to avoid a circular-chunk bug
  // ("__exportAll is not a function") that otherwise breaks the Vercel build.
  ...(isVercel
    ? { nitro: { preset: "vercel", inlineDynamicImports: true } as { preset: string } }
    : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
