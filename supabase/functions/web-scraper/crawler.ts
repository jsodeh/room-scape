
import { corsHeaders } from './cors.ts';
import { extractProductDetails } from './productExtractor.ts';

interface CrawlRequest {
  url: string;
  limit?: number;
  formats?: string[];
}

export async function performCrawl(req: Request, FIRECRAWL_API_KEY: string | undefined) {
  try {
    const reqBody = await req.json();
    const { url, limit = 100, formats = ['markdown', 'html'] } = reqBody as CrawlRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Crawling URL: ${url} with limit: ${limit}`);

    if (!FIRECRAWL_API_KEY) {
      console.error('Missing FIRECRAWL_API_KEY environment variable');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Missing Firecrawl API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Make the request to Firecrawl API
    let crawlResponse;
    try {
      // Using the correct endpoint URL from Firecrawl docs
      console.log('Calling Firecrawl API at: https://api.firecrawl.dev/api/crawl');
      crawlResponse = await fetch('https://api.firecrawl.dev/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          limit,
          scrapeOptions: {
            formats
          }
        })
      });
      
      console.log(`Firecrawl API response status: ${crawlResponse.status}`);
      
      if (!crawlResponse.ok) {
        const errorText = await crawlResponse.text();
        throw new Error(`Firecrawl API returned status ${crawlResponse.status}: ${errorText}`);
      }
    } catch (fetchError) {
      console.error('Fetch error when calling Firecrawl API:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Network error when calling Firecrawl API: ${fetchError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Firecrawl API error:', crawlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl API error: ${crawlResponse.status} ${errorText}` 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let crawlData;
    try {
      crawlData = await crawlResponse.json();
      console.log('Successfully parsed Firecrawl API response as JSON');
    } catch (jsonError) {
      console.error('Error parsing Firecrawl API response as JSON:', jsonError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid JSON response from Firecrawl API: ${jsonError.message}` 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process the crawled data to extract product information
    if (crawlData?.pages?.length > 0) {
      console.log(`Successfully crawled ${crawlData.pages.length} pages`);
      
      // Extract product details from crawled pages
      const extractedProducts = extractProductDetails(crawlData.pages);
      crawlData.extractedProducts = extractedProducts;
      
      console.log(`Extracted ${extractedProducts.length} products from crawled pages`);
    } else {
      console.log('No pages were crawled or returned by Firecrawl API');
    }
    
    return new Response(
      JSON.stringify({ success: true, data: crawlData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing crawl request:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
