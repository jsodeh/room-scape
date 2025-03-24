
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

interface CrawlRequest {
  url: string;
  limit?: number;
  formats?: string[];
}

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

  try {
    const reqBody = await req.json();
    const { url, limit = 100, formats = ['markdown', 'html'] } = reqBody as CrawlRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Crawling URL: ${url} with limit: ${limit}`);

    if (!FIRECRAWL_API_KEY) {
      console.error('Missing FIRECRAWL_API_KEY environment variable');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Missing Firecrawl API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make the request to Firecrawl API with corrected URL according to documentation
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
      )
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
      )
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
      )
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
    )
  } catch (error) {
    console.error('Error processing crawl request:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});

// Function to extract product details from crawled pages
function extractProductDetails(pages) {
  const products = [];
  
  for (const page of pages) {
    // Skip pages without content or images
    if (!page.content || !page.images || page.images.length === 0) continue;
    
    const title = page.title || getNameFromUrl(page.url);
    const description = extractDescription(page.content);
    const category = guessCategory(title, page.content);
    
    // Extract potential price information
    const price = extractPrice(page.content);
    
    // Extract specifications or features
    const specs = extractSpecifications(page.content);
    
    // Create a product entry for each image on the page
    for (const imageUrl of page.images) {
      if (isValidImageUrl(imageUrl)) {
        products.push({
          name: title,
          description,
          category,
          imageUrl,
          price,
          specifications: specs,
          pageUrl: page.url
        });
      }
    }
  }
  
  return products;
}

// Helper function to check if URL is a valid image
function isValidImageUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    return path.endsWith('.jpg') || 
           path.endsWith('.jpeg') || 
           path.endsWith('.png') || 
           path.endsWith('.webp') || 
           path.endsWith('.gif');
  } catch {
    return false;
  }
}

// Helper functions
function getNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Get last path segment and convert to title case
      return pathParts[pathParts.length - 1]
        .replace(/-|_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    // Fallback to hostname
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unnamed Item';
  }
}

function extractDescription(content) {
  // Find first paragraph or reasonable block of text
  if (!content) return '';
  
  // Get first 200 characters as description
  const cleanText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
    
  return cleanText.length > 200 
    ? cleanText.substring(0, 197) + '...' 
    : cleanText;
}

function guessCategory(name, content) {
  const text = (name + ' ' + content).toLowerCase();
  
  // Simple category detection based on keywords
  if (text.includes('sofa') || text.includes('couch') || text.includes('sectional')) {
    return 'sofas';
  } else if (text.includes('table') || text.includes('desk')) {
    return 'tables';
  } else if (text.includes('chair') || text.includes('stool')) {
    return 'chairs';
  } else if (text.includes('bed') || text.includes('mattress')) {
    return 'beds';
  } else if (text.includes('shelf') || text.includes('cabinet') || text.includes('drawer')) {
    return 'storage';
  } else if (text.includes('lamp') || text.includes('light')) {
    return 'lighting';
  } else if (text.includes('rug') || text.includes('pillow') || text.includes('decor')) {
    return 'decor';
  }
  
  return 'decor'; // Default category
}

function extractPrice(content) {
  if (!content) return null;
  
  // Common price patterns in USD
  const priceRegex = /\$\s?[\d,]+(\.\d{2})?|\$[\d,]+(\.\d{2})?/g;
  const matches = content.match(priceRegex);
  
  if (matches && matches.length > 0) {
    // Return the first match, cleaned up
    return matches[0].replace(/[^\d.]/g, '');
  }
  
  return null;
}

function extractSpecifications(content) {
  if (!content) return [];
  
  const specs = [];
  
  // Look for common spec patterns like "Dimensions: 30 x 40 inches"
  const dimensionsRegex = /dimensions:?\s*([^\.]+)/i;
  const dimensionsMatch = content.match(dimensionsRegex);
  if (dimensionsMatch && dimensionsMatch[1]) {
    specs.push({ name: "Dimensions", value: dimensionsMatch[1].trim() });
  }
  
  // Look for materials
  const materialsRegex = /materials?:?\s*([^\.]+)/i;
  const materialsMatch = content.match(materialsRegex);
  if (materialsMatch && materialsMatch[1]) {
    specs.push({ name: "Materials", value: materialsMatch[1].trim() });
  }
  
  // Look for colors
  const colorsRegex = /colou?rs?:?\s*([^\.]+)/i;
  const colorsMatch = content.match(colorsRegex);
  if (colorsMatch && colorsMatch[1]) {
    specs.push({ name: "Colors", value: colorsMatch[1].trim() });
  }
  
  return specs;
}
