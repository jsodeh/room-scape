
// Import required modules
import { supabase } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { updateProjectStatus } from "./projectManager.ts";

// Gemini API configuration
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

// Function to generate a staged room using Stability AI
export async function generateStagedRoomWithStability(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Starting Stability API processing...");
    // Use Stability API for image generation - this code should already exist
    
    // Your existing Stability API implementation here...
    // This should include code for making the API request to Stability AI
    // and processing the response
    
    // The function should return an array of image URLs or base64 strings
    
    // For now, this is a placeholder to prevent errors
    throw new Error("Stability API implementation is not available. Please check your configuration.");
    
  } catch (error) {
    console.error("Error generating staged room with Stability:", error);
    await updateProjectStatus(projectId, "failed", `Stability API error: ${error.message}`);
    throw error;
  }
}

// Function to generate a staged room using Gemini Pro Vision
export async function generateStagedRoomWithGemini(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Starting Gemini 2.0 Flash API processing...");
    
    // Convert image to base64 for API request
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Construct a more explicit prompt for image generation
    const enhancedPrompt = `
I need you to generate a photorealistic image of a staged room based on this input room photo.
${prompt}

Important: Your response should be a high-quality, photorealistic image showing the room with the requested staging.
The image should maintain the same perspective, lighting, and architectural features as the original room.
Please provide the image in PNG format.
`;
    
    console.log("Prompt length:", enhancedPrompt.length);
    
    // Build Gemini API request for image generation
    const apiUrl = `${GEMINI_API_URL}/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`;
    
    // Construct the request body with image data
    const requestBody = {
      contents: [
        {
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
        temperature: 0.4,
        top_p: 0.95,
        max_output_tokens: 8192
      }
    };
    
    // Add reference image if provided
    if (referenceImageUrl) {
      try {
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
        requestBody.contents[0].parts[0].text += "\nUse the second provided image as a style reference.";
      } catch (refError) {
        console.log("Could not load reference image:", refError);
      }
    }
    
    console.log("Sending request to Gemini API");
    
    // Send request to Gemini API
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
    
    // Process and extract images from response
    const stagedImages: string[] = [];
    
    // Since Gemini Pro Vision doesn't directly generate images, but might provide image URLs or descriptions
    // we need to inform the user that we need to switch strategies
    
    // This is where we need to integrate with the actual image generation service
    // For now, we'll throw an error with a clear message
    console.error("Unexpected Gemini response format:", JSON.stringify(data));
    throw new Error("Gemini API did not return an image. We need to use a different approach for image generation.");
    
    // Return the staged images
    return stagedImages;
  } catch (error) {
    console.error("Error generating staged room with Gemini:", error);
    await updateProjectStatus(projectId, "failed", `Gemini API error: ${error.message}`);
    throw error;
  }
}
