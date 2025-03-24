
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"

interface AnalysisRequest {
  imageUrls?: string[];
  pdfUrl?: string;
  prompt?: string;
  mode: 'image' | 'pdf' | 'compare';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Check if API key is available
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: 'Gemini API key not found' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { imageUrls, pdfUrl, prompt, mode } = await req.json() as AnalysisRequest

    if (mode === 'image' && (!imageUrls || imageUrls.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image URLs are required for image mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (mode === 'pdf' && !pdfUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF URL is required for PDF mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (mode === 'compare' && (!imageUrls || imageUrls.length < 2)) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least two image URLs are required for compare mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing request in ${mode} mode`)

    // Build the Gemini API request
    const geminiRequest: any = {
      contents: [
        {
          parts: [
            { text: buildPrompt(mode, prompt) }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    }

    // Add image parts
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        const imageData = await fetchImageAsBase64(url)
        if (imageData) {
          geminiRequest.contents[0].parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData
            }
          })
        }
      }
    }

    // For PDF mode, we treat it as an image for now since direct PDF parsing 
    // requires additional processing
    if (pdfUrl && mode === 'pdf') {
      // In a real implementation, you'd convert PDF pages to images
      // For now, we'll send the URL to Gemini to see if it can handle it
      geminiRequest.contents[0].parts[0].text += `\nAnalyze the PDF at this URL: ${pdfUrl}`
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
        JSON.stringify({ success: false, error: data.error?.message || 'Failed to process with Gemini API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the generated content
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Parse structured data from the result (if available)
    const parsedData = tryParseStructuredData(result)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: result,
        structuredData: parsedData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to build the appropriate prompt
function buildPrompt(mode: string, userPrompt?: string): string {
  const basePrompt = userPrompt || ''
  
  if (mode === 'image') {
    return `You are a product analysis expert. Analyze this product image and extract as much information as possible including: name, category, description, dimensions, materials, colors, and any other relevant details. Return the information in a clear structured format. ${basePrompt}`.trim()
  } else if (mode === 'pdf') {
    return `You are a document analysis expert. Extract and summarize the key product information from this PDF including: product names, categories, descriptions, specifications, pricing if available, and any other relevant details. Format the information in a structured way. ${basePrompt}`.trim()
  } else if (mode === 'compare') {
    return `You are a product comparison expert. Compare these products and identify the key similarities and differences. Include details like: design, features, materials, dimensions, and any other notable aspects. Provide a structured comparison. ${basePrompt}`.trim()
  }
  
  return basePrompt
}

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status}`)
      return null
    }
    
    const imageBuffer = await response.arrayBuffer()
    return btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error)
    return null
  }
}

// Helper function to try parsing structured data from the Gemini response
function tryParseStructuredData(text: string): any {
  try {
    // Look for JSON blocks in the response
    const jsonMatches = text.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatches && jsonMatches[1]) {
      return JSON.parse(jsonMatches[1])
    }
    
    // If we can't find JSON blocks, try to structure the data ourselves
    const lines = text.split('\n')
    const structuredData: Record<string, string> = {}
    
    for (const line of lines) {
      // Look for "key: value" or "key - value" patterns
      const match = line.match(/^([^:]*?)[:|-]\s*(.*)$/)
      if (match && match[1] && match[2]) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_')
        structuredData[key] = match[2].trim()
      }
    }
    
    return Object.keys(structuredData).length > 0 ? structuredData : null
  } catch (error) {
    console.error('Error parsing structured data:', error)
    return null
  }
}
