
// Log configuration status at startup
export function logConfigStatus() {
  console.log("Supabase URL configured:", !!Deno.env.get("SUPABASE_URL"));
  console.log("Supabase Service Key configured:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  console.log("Gemini API Key configured:", !!Deno.env.get("GEMINI_API_KEY"));
}
