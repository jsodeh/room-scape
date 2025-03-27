
// Import dependencies
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";
import { supabase, stabilityApiKey, geminiApiKey } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { generateStagedRoomWithGemini } from "./geminiApi.ts";

// Function to generate a staged room using Stability AI API (v2beta API)
export async function generateStagedRoomWithStability(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl: string | undefined,
  projectId: string
): Promise<string[]> {
  try {
    console.log("Using Stability AI to generate staged room");
    
    // Check if Stability API key is available
    if (!stabilityApiKey) {
      throw new Error("Stability API key is not configured");
    }

    // For reference images, modify the prompt to include reference styling
    let enhancedPrompt = prompt;
    if (referenceImageUrl) {
      enhancedPrompt += ` Style the result similar to the reference image.`;
    }

    // Configuration for the API request
    const apiHost = "https://api.stability.ai";
    const apiEndpoint = `${apiHost}/v2beta/stable-image/edit/image-to-image`;
    
    // Create request body
    const formData = new FormData();
    formData.append("input_image", new Blob([roomImageData], { type: "image/jpeg" }), "room.jpg");
    formData.append("prompt", enhancedPrompt);
    formData.append("output_format", "png");
    formData.append("image_strength", "0.35");
    formData.append("seed", Math.floor(Math.random() * 2147483647).toString());
    
    // If we have a reference image, add it to the request
    if (referenceImageUrl) {
      try {
        console.log("Fetching reference image:", referenceImageUrl);
        const refResponse = await fetch(referenceImageUrl);
        const refImageData = await refResponse.arrayBuffer();
        
        formData.append("reference_image", new Blob([refImageData], { type: "image/jpeg" }), "reference.jpg");
        formData.append("reference_strength", "0.6");
      } catch (refError) {
        console.log("Error fetching reference image, proceeding without it:", refError);
      }
    }
    
    // Send request to Stability API
    console.log("Sending request to Stability API");
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${stabilityApiKey}`
      },
      body: formData
    });
    
    // Process the response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log("Stability API request completed");
    
    // Extract and process images from the response
    if (responseData.artifacts && responseData.artifacts.length > 0) {
      console.log(`Processing ${responseData.artifacts.length} images from Stability API`);
      return await processAndSaveResultImages(responseData.artifacts, projectId);
    } else {
      throw new Error("No images found in Stability API response. Please check your API key and request parameters.");
    }
  } catch (error) {
    console.error("Error generating staged room:", error);
    await updateProjectStatus(projectId, "failed", `Stability AI error: ${error.message}`);
    throw error;
  }
}

// Main function to handle staged room generation using the appropriate API
export async function generateStagedRoom(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl?: string,
  projectId?: string
): Promise<string[]> {
  if (!projectId) {
    throw new Error("Project ID is required for staged room generation");
  }
  
  // Determine which API to use based on available keys
  // Prioritize Gemini if available
  if (geminiApiKey) {
    console.log("Using Gemini 2.0 Flash Experimental Image Generation API");
    return await generateStagedRoomWithGemini(roomImageData, prompt, referenceImageUrl, projectId);
  } else if (stabilityApiKey) {
    console.log("Falling back to Stability AI for image generation");
    return await generateStagedRoomWithStability(roomImageData, prompt, referenceImageUrl, projectId);
  } else {
    throw new Error("No image generation API keys configured. Please set GEMINI_API_KEY or STABILITY_API_KEY in your Supabase secrets.");
  }
}
