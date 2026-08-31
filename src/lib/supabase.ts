import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[P1KACZ TIERS] Brak VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Skopiuj .env.example do .env i uzupełnij dane swojego projektu Supabase.'
  );
}

// NOTE: intentionally not passing a <Database> generic here. A hand-written
// schema type without every table/RPC signature makes supabase-js infer
// `never` for inserts/updates it doesn't recognize, which breaks `tsc -b`
// even though the queries are correct at runtime. If you want full
// type-safety later, generate the real types with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts
// and re-add `createClient<Database>(...)` once that file matches your
// actual schema (including RPC functions).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
