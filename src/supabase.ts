import { createClient } from "@supabase/supabase-js";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

export const SUPABASE_URL = __SUPABASE_URL__;
export const SUPABASE_KEY = __SUPABASE_KEY__;

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function saveAccountGame(player: unknown) {
  if (!supabase) return { data: null, error: new Error("Supabase n'est pas configuré.") };
  return supabase.auth.updateUser({ data: { anime_rng_save: player } });
}
