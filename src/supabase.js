import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Env Node 1 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) belum terbaca.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
