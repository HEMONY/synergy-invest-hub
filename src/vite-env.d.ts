/// <reference types="vite/client" />

// Declaring these as named (optional) properties — instead of relying on the
// generic index signature — lets us access them with dot notation
// (import.meta.env.VITE_SUPABASE_URL) without a TS4111 error. This matters
// functionally, not just stylistically: Vite only statically replaces
// import.meta.env.KEY (dot notation) with the real build-time value.
// import.meta.env['KEY'] (bracket notation) is NOT replaced and returns
// undefined in the browser bundle, even when the env var is set correctly.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_PROJECT_ID?: string;
  }
}
