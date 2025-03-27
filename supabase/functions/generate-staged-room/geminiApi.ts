
// Import required modules
import { supabase, geminiApiKey } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";

// Gemini API configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.0-flash-exp-image-generation"; // Using experimental image generation model

// Function to generate a staged room using Gemini 2.0 Flash API
export async function generateStagedRoomWithGemini(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Starting Gemini 2.0 Flash Experimental Image Generation API processing...");
    
    // Verify Gemini API key is available
    if (!geminiApiKey) {
      throw new Error("Gemini API key is not configured");
    }
    
    // Convert room image to base64 for API request
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
      generation_config: {
        temperature: 1,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 8192,
        response_modalities: ["image", "text"],
        response_mime_type: "text/plain"
      }
    };
    
    // Add reference image if provided
    if (referenceImageUrl) {
      try {
        console.log("Adding reference image to Gemini request");
        const referenceImageResponse = await fetch(referenceImageUrl);
        const referenceImageBuffer = await referenceImageResponse.arrayBuffer();
        const referenceBase64 = arrayBufferToBase64(referenceImageBuffer);
        
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: referenceBase64
          }
        });
        
        // Update prompt to mention reference image
        requestBody.contents[0].parts[0].text += "\nUse the provided reference image as a style guide.";
      } catch (refError) {
        console.log("Could not load reference image:", refError);
      }
    }
    
    console.log("Sending request to Gemini API");
    
    // Send request to Gemini API using the chat completions endpoint
    const apiUrl = `${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
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
      console.error("Unexpected Gemini response format:", JSON.stringify(data));
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
