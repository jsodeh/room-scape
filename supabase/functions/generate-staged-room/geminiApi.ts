
import { updateProjectStatus, updateProjectWithResults } from "./projectManager.ts";
import { fetchImage } from "./imageProcessor.ts";
import { stabilityApiKey } from "./supabaseClient.ts";

// Generate staged room using Stability AI API
export async function generateStagedRoomWithStability(
  roomImageData: ArrayBuffer, 
  prompt: string, 
  referenceImageUrl: string | undefined, 
  projectId: string
): Promise<string[]> {
  console.log("Using Stability AI API to generate staged room");
  
  try {
    if (!stabilityApiKey) {
      console.error("STABILITY_API_KEY is not configured in environment variables");
      throw new Error("STABILITY_API_KEY is not set. Please configure it in the Supabase secrets.");
    }
    
    // Convert room image data to base64
    const roomImageBase64 = btoa(String.fromCharCode(...new Uint8Array(roomImageData)));
    
    // Prepare reference image if provided
    let referenceImageBase64: string | undefined;
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        referenceImageBase64 = btoa(String.fromCharCode(...new Uint8Array(refImageData)));
        console.log("Reference image processed successfully");
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    // Prepare the request body
    const requestBody: any = {
      text_prompts: [
        {
          text: prompt,
          weight: 1.0
        }
      ],
      init_image: roomImageBase64,
      init_image_mode: "IMAGE_STRENGTH",
      image_strength: 0.35,
      cfg_scale: 7,
      samples: 1,
      steps: 30
    };
    
    // Add negative prompt for better results
    requestBody.text_prompts.push({
      text: "unrealistic, artificial, fake, blurry, low quality, distorted dimensions, uneven lighting",
      weight: -1.0
    });
    
    // Log request details for debugging
    console.log("Sending request to Stability AI API");
    console.log("Prompt length:", prompt.length);
    
    // Make the API request to Stability AI
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-image-xl/image-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${stabilityApiKey}`
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Stability API error (${response.status}):`, errorText);
      throw new Error(`Stability API error (status ${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Stability API response received");
    
    // Extract the images from the response
    if (!result.artifacts || !Array.isArray(result.artifacts) || result.artifacts.length === 0) {
      console.error("Unexpected Stability API response format:", JSON.stringify(result));
      throw new Error("No images found in Stability API response. Please check your API key and request parameters.");
    }
    
    // Process and save the images
    const imageUrls = await processAndSaveStabilityResults(result.artifacts, projectId);
    return imageUrls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating staged room with Stability:", errorMessage);
    
    // Update project status with detailed error message
    await updateProjectStatus(
      projectId, 
      "failed", 
      `Stability AI error: ${errorMessage}`
    );
    
    throw error;
  }
}

// Process and save the Stability-generated images
async function processAndSaveStabilityResults(artifacts: any[], projectId: string): Promise<string[]> {
  try {
    // Import the processAndSaveResultImages function
    const { processAndSaveResultImages } = await import("./imageProcessor.ts");
    
    // Process and save the images
    const imageUrls = await processAndSaveResultImages(artifacts, projectId);
    return imageUrls;
  } catch (error) {
    console.error("Error processing Stability result:", error);
    throw error;
  }
}
