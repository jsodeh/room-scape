
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

interface AnalysisRequest {
  imageUrl: string;
  prompt?: string;
  mode: 'staging' | 'interior' | 'general';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Check if API key is available
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not found')
    return new Response(
      JSON.stringify({ success: false, error: 'Gemini API key not found' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    console.log('Request received:', req.url)
    
    const requestData = await req.json() as AnalysisRequest
    console.log('Request data:', JSON.stringify(requestData))

    const { imageUrl, prompt, mode } = requestData

    if (!imageUrl) {
      console.error('Image URL is missing')
      return new Response(
        JSON.stringify({ success: false, error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Analyzing image in ${mode} mode:`, imageUrl)

    // Fetch the image
    console.log('Fetching image data...')
    const imageData = await fetchImageAsBase64(imageUrl)
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
                mime_type: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.4,
        top_k: 32,
        top_p: 1,
        max_output_tokens: 2048,
      }
    }

    console.log("Sending request to Gemini API")
    
    // Make the request to Gemini API
    const apiUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error("Gemini API error:", data)
      return new Response(
        JSON.stringify({ success: false, error: data.error?.message || 'Failed to analyze image with Gemini API' }),
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
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
  }
  
  // Default/general mode
  return `You are an expert in design analysis. Please analyze this image in detail and describe what you see, focusing on design elements, style, and notable features. ${basePrompt}`.trim()
}

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    console.log(`Fetching image from URL: ${url}`)
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status}`)
      return null
    }
    
    const imageBuffer = await response.arrayBuffer()
    console.log(`Image fetched, size: ${imageBuffer.byteLength} bytes`)
    return btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error)
    return null
  }
}

// Helper function to extract staging instructions from the analysis
function extractInstructions(analysis: string, mode: string): string {
  // For staging mode, try to extract just the instructions part
  if (mode === 'staging') {
    // Look for instructions section or use the whole analysis if not found
    const instructionsMatch = analysis.match(/(?:Instructions|Staging Instructions|Here are the staging instructions):([\s\S]+)$/i)
    if (instructionsMatch && instructionsMatch[1]) {
      return instructionsMatch[1].trim()
    }
    
    // If we can't find a specific instructions section, use the second half of the text
    // which likely contains more actionable content
    const lines = analysis.split('\n')
    if (lines.length > 10) {
      return lines.slice(Math.floor(lines.length / 2)).join('\n').trim()
    }
  }
  
  return analysis
}
