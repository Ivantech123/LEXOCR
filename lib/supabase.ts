
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These should be in process.env in a real app.
// For this environment, user must provide them or we fallback to placeholders.
// The app will prompt for them if not found in localStorage.

const getSupabaseConfig = () => {
    const url = localStorage.getItem('lex_supabase_url') || process.env.SUPABASE_URL || '';
    const key = localStorage.getItem('lex_supabase_key') || process.env.SUPABASE_ANON_KEY || '';
    return { url, key };
};

const config = getSupabaseConfig();

export const supabase = config.url && config.key 
    ? createClient(config.url, config.key) 
    : null;

export const updateSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('lex_supabase_url', url);
    localStorage.setItem('lex_supabase_key', key);
    window.location.reload(); // Reload to re-init client
};

export const hasSupabaseConfig = () => !!supabase;
