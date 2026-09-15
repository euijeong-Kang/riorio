import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseScheduleConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient | null = isSupabaseScheduleConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
