import { createClient } from '@supabase/supabase-js';

let supabase = null as ReturnType<typeof createClient> | null;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
} else {
  console.warn('Supabase env not configured, using local JSON storage fallback');
}

export { supabase };
