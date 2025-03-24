
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY')

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
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const reqBody = await req.json();
    const { url, limit = 100, formats = ['markdown', 'html'] } = reqBody as CrawlRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Crawling URL: ${url} with limit: ${limit}`);

    if (!FIRECRAWL_API_KEY) {
      console.error('Missing FIRECRAWL_API_KEY environment variable');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Missing API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Make the request to Firecrawl API
    const crawlResponse = await fetch('https://api.firecrawl.dev/api/v1/crawl', {
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

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Firecrawl API error:', crawlResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl API error: ${crawlResponse.status} ${errorText}` 
        }),
        { status: crawlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const crawlData = await crawlResponse.json();
    
    // Extract images for further analysis if Stability API key is available
    if (STABILITY_API_KEY && crawlData?.pages?.length > 0) {
      try {
        // Process the first few images with Stability AI
        const imagesToAnalyze = [];
        let imageCount = 0;
        
        // Collect images from pages
        for (const page of crawlData.pages) {
          if (page.images && page.images.length > 0) {
            for (const imageUrl of page.images) {
              if (imageCount < 5 && isValidImageUrl(imageUrl)) { // Limit to 5 images
                imagesToAnalyze.push({
                  url: imageUrl,
                  title: page.title || '',
                  pageUrl: page.url
                });
                imageCount++;
              }
              
              if (imageCount >= 5) break;
            }
          }
          
          if (imageCount >= 5) break;
        }
        
        // If we have images to analyze, use Stability AI
        if (imagesToAnalyze.length > 0) {
          console.log(`Analyzing ${imagesToAnalyze.length} images with Stability AI`);
          
          const imageAnalysisResults = await Promise.allSettled(
            imagesToAnalyze.map(async (image) => {
              return await analyzeImageWithStability(image.url);
            })
          );
          
          // Add analysis results to crawl data
          crawlData.imageAnalysis = imageAnalysisResults.map((result, index) => {
            return {
              imageUrl: imagesToAnalyze[index].url,
              title: imagesToAnalyze[index].title,
              pageUrl: imagesToAnalyze[index].pageUrl,
              analysis: result.status === 'fulfilled' ? result.value : null,
              error: result.status === 'rejected' ? result.reason : null
            };
          });
        }
      } catch (analysisError) {
        console.error('Error during image analysis:', analysisError);
        // Continue with the crawl data even if image analysis fails
      }
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

// Helper function to check if URL is a valid image
function isValidImageUrl(url: string): boolean {
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

// Function to analyze image with Stability AI
async function analyzeImageWithStability(imageUrl: string) {
  if (!STABILITY_API_KEY) {
    throw new Error('Missing Stability API key');
  }

  try {
    // First, we need to fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Call Stability AI's API for image analysis
    const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1.0/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: "Analyze this furniture item and describe it in detail",
            weight: 1.0
          }
        ],
        init_image: Buffer.from(imageBuffer).toString('base64'),
        image_strength: 0.35,
        cfg_scale: 7,
        samples: 1,
      })
    });
    
    if (!stabilityResponse.ok) {
      const errorData = await stabilityResponse.text();
      throw new Error(`Stability API error: ${stabilityResponse.status} ${errorData}`);
    }
    
    const analysisData = await stabilityResponse.json();
    return analysisData;
  } catch (error) {
    console.error(`Error analyzing image ${imageUrl}:`, error);
    throw error;
  }
}
