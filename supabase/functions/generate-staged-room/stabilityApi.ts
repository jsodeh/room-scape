
import { updateProjectStatus } from "./projectManager.ts";
import { processAndSaveResultImages } from "./imageProcessor.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { fetchImage } from "./imageProcessor.ts";

const stabilityApiKey = Deno.env.get("STABILITY_API_KEY") || "";

// Generate staged room using Stability AI v2beta API
export async function generateStagedRoomV2(
  roomImageData: ArrayBuffer, 
  prompt: string, 
  referenceImageUrl: string | undefined, 
  projectId: string
): Promise<string[]> {
  console.log("Using Stability AI v2beta API to generate staged room");
  
  try {
    // Convert image data to base64
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Prepare request body for the v2beta search-and-replace endpoint
    const requestBody: Record<string, any> = {
      image: base64Image,
      prompt: prompt,
      seed: Math.floor(Math.random() * 2147483647),  // Random seed value
      cfg_scale: 7,
      samples: 1
    };
    
    // Reference image if provided
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        requestBody.reference_image = arrayBufferToBase64(refImageData);
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    console.log("Sending request to Stability AI v2beta API");
    console.log("Using endpoint: search-and-replace");
    
    // Make request to Stability AI v2beta API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stabilityApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability API error response:", response.status);
      console.error("Error details:", errorText);
      throw new Error(`Stability API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Received successful response from Stability API");
    
    if (!result.artifacts || result.artifacts.length === 0) {
      throw new Error("No images returned from Stability API");
    }
    
    // Process and upload images to Supabase storage
    const imageUrls = await processAndSaveResultImages(result.artifacts, projectId);
    return imageUrls;
  } catch (error) {
    console.error("Error generating staged room:", error);
    await updateProjectStatus(projectId, "failed", error.message);
    throw error;
  }
}
