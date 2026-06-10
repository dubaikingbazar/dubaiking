import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wejvwqncgapzzwvafjet.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlanZ3cW5jZ2Fwenp3dmFmamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDYyMTAsImV4cCI6MjA5NjU4MjIxMH0.jCtqE-XJoWzbCdjBk2HfpfRifIypYkhPUXMNG_6HhT0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
