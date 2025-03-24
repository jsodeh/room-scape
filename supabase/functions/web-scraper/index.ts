
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from './cors.ts'
import { performCrawl } from './crawler.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Check if the request is authorized
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Delegate to the crawler module
  return performCrawl(req, FIRECRAWL_API_KEY)
});
