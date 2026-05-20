let supabaseClient = null;

try {
    const SUPABASE_URL = window.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.warn('Supabase not configured, using fallback doctors only.');
}