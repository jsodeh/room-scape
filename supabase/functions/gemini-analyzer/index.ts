import { corsHeaders } from "../_shared/cors.ts"
import { HttpError, requireUser, requireOwnedAsset, fetchAsset } from "../_shared/security.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = Deno.env.get('GEMINI_ANALYSIS_MODEL') || 'gemini-2.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface AnalysisRequest {
  imageUrl: string;
  imageUrls?: string[];
  pdfUrl?: string;
  prompt?: string;
  mode: 'staging' | 'interior' | 'general' | 'image' | 'pdf' | 'compare';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST for analysis.')
    const user = await requireUser(req)
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.')
    console.log('Request received:', req.url)
    
    const requestData = await req.json() as AnalysisRequest
    console.log('Request data:', JSON.stringify(requestData))

    const { imageUrl, imageUrls, pdfUrl, prompt, mode } = requestData
    const targetImageUrl = imageUrl || (imageUrls && imageUrls[0]) || pdfUrl
    requireOwnedAsset(targetImageUrl, user.id)
    if (mode === 'pdf' && user.app_metadata?.role !== 'admin') throw new HttpError(403, 'PDF analysis requires an administrator.')

    if (!targetImageUrl) {
      console.error('Image URL is missing')
      return new Response(
        JSON.stringify({ success: false, error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Analyzing image in ${mode} mode:`, targetImageUrl)

    // Fetch the image
    console.log('Fetching image data...')
    const { data: imageBuffer, contentType } = await fetchAsset(targetImageUrl, mode === 'pdf')
    const imageData = encodeBase64(imageBuffer)
    if (!imageData) {
      console.error('Failed to fetch image data')
      throw new Error('Failed to fetch image data')
    }
    console.log('Image data fetched successfully')

    // Build the Gemini API request
    const geminiPrompt = buildPrompt(mode, prompt)
    console.log('Using prompt:', geminiPrompt)
    
    const geminiRequest = {
      contents: [
        {
          parts: [
            { text: geminiPrompt },
            {
              inline_data: {
                mime_type: contentType,
                data: imageData
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
        responseModalities: ["TEXT"]
      }
    }

    console.log("Sending request to Gemini API")
    
    // Make the request to Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(geminiRequest),
      signal: AbortSignal.timeout(90000),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error("Gemini API error:", data)
      return new Response(
        JSON.stringify({ success: false, error: 'The analysis provider could not complete this request.' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the generated content - updated for the new model response format
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Analysis received:', analysis.substring(0, 100) + '...')
    
    const generatedInstructions = extractInstructions(analysis, mode)
    console.log('Generated instructions:', generatedInstructions.substring(0, 100) + '...')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        generatedInstructions
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error analyzing image:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof HttpError ? error.message : 'The reference could not be analysed. Please try again.' }),
      { status: error instanceof HttpError ? error.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to build the appropriate prompt based on mode
function buildPrompt(mode: string, userPrompt?: string): string {
  const basePrompt = userPrompt || ''
  
  if (mode === 'staging') {
    return `You are an expert interior designer specializing in virtual staging. 
    
Analyze this reference image in detail and generate specific staging instructions that would help recreate a similar style and atmosphere in another room. 

Your analysis should include:
1. Overall style and design aesthetic (e.g., minimalist, traditional, industrial, etc.)
2. Color scheme and palette
3. Key furniture pieces and their characteristics
4. Decor elements and accessories
5. Lighting considerations
6. Materials and textures
7. Spatial arrangement and layout principles

Then, create a concise set of staging instructions (around 150-200 words) that captures the essence of this design, written in second person ("Stage this room with..."). Focus on actionable tips that would help recreate this style.

${basePrompt}`.trim()
  } else if (mode === 'interior') {
    return `You are an expert interior designer. Analyze this image in detail and describe the key elements of the interior design, including style, color palette, furniture, materials, and layout. Then, provide specific recommendations for how similar design principles could be applied to another space. ${basePrompt}`.trim()
  } else if (mode === 'image' || mode === 'compare') {
    return `You are an expert in product analysis and interior design. Analyze this ${mode === 'compare' ? 'set of product images' : 'product image'} in detail. 
    
Describe the following aspects:
1. Product type, style, and overall aesthetic
2. Material composition and quality assessment
3. Design elements, patterns, and unique features
4. Color palette and potential matching options
5. Functionality and use cases
6. Estimated price range
7. Pros and cons

${basePrompt}`.trim()
  } else if (mode === 'pdf') {
    return `You are an expert in analyzing product documentation. Review this PDF document and extract key information about the products described, including specifications, materials, design features, and pricing if available. Provide a structured analysis that would be useful for inventory management. ${basePrompt}`.trim()
  }
  
  // Default/general mode
  return `You are an expert in design analysis. Please analyze this image in detail and describe what you see, focusing on design elements, style, and notable features. ${basePrompt}`.trim()
}

// Encode in bounded chunks; fetchAsset enforces the download limit.
function encodeBase64(data: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(data)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Helper function to extract staging instructions from the analysis
function extractInstructions(analysis: string, mode: string): string {
  if (mode === 'staging') {
    const instructionsMatch = analysis.match(/(?:Instructions|Staging Instructions|Here are the staging instructions):([\s\S]+)$/i)
    if (instructionsMatch && instructionsMatch[1]) {
      return instructionsMatch[1].trim()
    }
    
    const lines = analysis.split('\n')
    if (lines.length > 10) {
      return lines.slice(Math.floor(lines.length / 2)).join('\n').trim()
    }
  }
  
  return analysis
}
