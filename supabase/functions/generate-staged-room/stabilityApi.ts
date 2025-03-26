
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";
import { fetchImage } from "./imageProcessor.ts";
import { StabilityApiClient } from "./stabilityApiClient.ts";
import { prepareStabilityRequest } from "./stabilityRequestBuilder.ts";
import { handleStabilityResponse } from "./stabilityResponseHandler.ts";
import { stabilityApiKey } from "./supabaseClient.ts";

// Generate staged room using Stability AI v2beta API
export async function generateStagedRoomV2(
  roomImageData: ArrayBuffer, 
  prompt: string, 
  referenceImageUrl: string | undefined, 
  projectId: string
): Promise<string[]> {
  console.log("Using Stability AI v2beta API to generate staged room");
  
  try {
    if (!stabilityApiKey) {
      console.error("STABILITY_API_KEY is not configured in environment variables");
      throw new Error("STABILITY_API_KEY is not set. Please configure it in the Supabase secrets.");
    }
    
    // Create stability API client
    const stabilityClient = new StabilityApiClient(stabilityApiKey);
    
    // Prepare the request with room image and optional reference image
    const formData = await prepareStabilityRequest(
      roomImageData,
      prompt,
      referenceImageUrl
    );
    
    // Make the API request to Stability AI
    console.log("Sending request to Stability AI...");
    const result = await stabilityClient.generateImage(formData);
    
    // Process the response and extract images
    console.log("Processing response from Stability AI...");
    const artifacts = handleStabilityResponse(result);
    
    if (artifacts.length === 0) {
      throw new Error("No images returned from Stability API. Please check your prompt and try again.");
    }
    
    console.log(`Processing ${artifacts.length} generated images`);
    
    // Process and upload images to Supabase storage
    const imageUrls = await processAndSaveResultImages(artifacts, projectId);
    return imageUrls;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating staged room:", errorMessage);
    
    // Update project status with detailed error message
    await updateProjectStatus(
      projectId, 
      "failed", 
      `Stability AI error: ${errorMessage}`
    );
    
    throw error;
  }
}
