
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

// Environment variables
export const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
export const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";
export const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => globalThis.fetch(input, init) },
});
