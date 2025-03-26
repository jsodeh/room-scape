
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { handleStagingRequest } from "./handlers.ts";
import { logConfigStatus } from "./config.ts";

// Log configuration status on startup
logConfigStatus();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Process the staging request
  return await handleStagingRequest(req);
});
