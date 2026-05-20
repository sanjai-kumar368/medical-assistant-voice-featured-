
const SUPABASE_URL = 'https://dmxvqjrixdvfmgvhpgbf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteHZxanJpeGR2Zm1ndmhwZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzY5MDQsImV4cCI6MjA4NDgxMjkwNH0.1I_gV2Pi0aL7KJmiR-FWRx4VPayGxSHXC6pqscULUOM';

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client initialized successfully!");
} else {
    console.warn("Supabase library not loaded. Make sure the CDN script is placed in your HTML header.");
}
