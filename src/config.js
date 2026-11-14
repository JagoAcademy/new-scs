import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SB_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SB_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Env Node 2 (VITE_SB_URL / VITE_SB_KEY) belum terbaca.');
}

export const sb = createClient(supabaseUrl, supabaseKey);
