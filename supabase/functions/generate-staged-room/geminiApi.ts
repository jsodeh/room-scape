
// Import required modules
import { supabase, geminiApiKey } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";

// Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") || "gemini-2.5-flash-image";

// Function to generate a staged room using Gemini 2.0 Flash API
export async function generateStagedRoomWithGemini(
  roomImageData: ArrayBuffer,
  prompt: string,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Starting Gemini image generation with model:", GEMINI_MODEL);
    
    // Verify Gemini API key is available
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured");
    }
    
    // Convert room image to base64 for API request - THIS IS THE PRIMARY IMAGE TO BE TRANSFORMED
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Construct a specific prompt for image-to-image generation
    const enhancedPrompt = `
Generate a photorealistic virtual staging of this room:
${prompt}

The staged room should look professional and maintain the original room structure.
`;
    
    console.log("Prompt length:", enhancedPrompt.length);
    
    // Build the request body for the chat session
    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: enhancedPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ["TEXT", "IMAGE"],
      }
    };
    
    console.log("Sending request to Gemini API");
    
    // Send request to Gemini API using the chat completions endpoint
    const apiUrl = `${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(90000),
    });
    
    // Check for error responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (status ${response.status}): ${errorText}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("Gemini API response received");
    
    // Extract images from the response
    const generatedImages: string[] = [];
    
    if (data.candidates && data.candidates.length > 0) {
      for (const candidate of data.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check for inline image data
            if (part.inlineData) {
              console.log("Found inline image data in response");
              generatedImages.push(part.inlineData.data);
            }
          }
        }
      }
    }
    
    if (generatedImages.length === 0) {
      // If no images found in the expected format, check the full response for debugging
      console.error("Gemini response did not contain an image.");
      throw new Error("Gemini did not return any images. Please try updating your prompt or contact support.");
    }
    
    console.log(`Processing ${generatedImages.length} images from Gemini API`);
    return await processAndSaveResultImages(generatedImages.map(img => ({ image: img })), projectId);
  } catch (error) {
    console.error("Error generating staged room with Gemini:", error);
    await updateProjectStatus(projectId, "failed", `Gemini API error: ${error.message}`);
    throw error;
  }
}
