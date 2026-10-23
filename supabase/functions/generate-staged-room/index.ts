
import { corsHeaders } from "./cors.ts";
import { handleStagingRequest } from "./handlers.ts";
import { logConfigStatus } from "./config.ts";

// Log configuration status on startup
logConfigStatus();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Process the staging request
  return await handleStagingRequest(req);
});
