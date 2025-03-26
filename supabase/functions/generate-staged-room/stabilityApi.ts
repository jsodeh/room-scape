
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
    if (!stabilityApiKey) {
      console.error("STABILITY_API_KEY is not configured in environment variables");
      throw new Error("STABILITY_API_KEY is not set. Please configure it in the Supabase secrets.");
    }
    
    // Convert image data to base64
    const base64Image = arrayBufferToBase64(roomImageData);
    
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Create a Blob from the room image data
    const roomImageBlob = new Blob([new Uint8Array(roomImageData)], { type: 'image/jpeg' });
    formData.append('image', roomImageBlob, 'room_image.jpg');
    formData.append('prompt', prompt);
    formData.append('seed', Math.floor(Math.random() * 2147483647).toString());
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');
    
    // Reference image if provided
    if (referenceImageUrl) {
      try {
        const refImageData = await fetchImage(referenceImageUrl, "reference");
        const refImageBlob = new Blob([new Uint8Array(refImageData)], { type: 'image/jpeg' });
        formData.append('reference_image', refImageBlob, 'reference_image.jpg');
        console.log("Added reference image to the request");
      } catch (refError) {
        console.error("Error processing reference image, continuing without it:", refError);
      }
    }
    
    console.log("Sending request to Stability AI v2beta API");
    console.log("Using endpoint: search-and-replace");
    console.log("Prompt being sent:", prompt);
    
    // Make request to Stability AI v2beta API
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stabilityApiKey}`,
          // Content-Type is automatically set by the FormData
        },
        body: formData
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
