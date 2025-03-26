
// Configuration and setup for the generate-staged-room function
export function logConfigStatus() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";

  // Log configuration status (without revealing keys)
  console.log("Supabase URL configured:", !!supabaseUrl);
  console.log("Supabase Service Key configured:", !!supabaseServiceKey);
  console.log("Stability API Key configured:", !!stabilityApiKey);

  if (!stabilityApiKey) {
    console.error("STABILITY_API_KEY is not configured. Please add it to your Supabase secrets.");
  }
}
