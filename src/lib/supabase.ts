import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key-placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
