
import { fetchImage } from "./imageProcessor.ts";

// Prepare the request data for Stability API
export async function prepareStabilityRequest(
  roomImageData: ArrayBuffer,
  prompt: string,
  referenceImageUrl?: string
): Promise<FormData> {
  // Log image size which can help diagnose timeouts
  const imageSizeMB = roomImageData.byteLength / (1024 * 1024);
  console.log(`Room image size: ${imageSizeMB.toFixed(2)}MB`);
  
  // Strict size limit check
  if (imageSizeMB > 4) {
    const sizeError = `Image size (${imageSizeMB.toFixed(2)}MB) exceeds the 4MB limit for Stability AI.`;
    console.error(sizeError);
    throw new Error(sizeError);
  }
  
  // Create FormData for multipart/form-data request
  console.log("Creating FormData with image and parameters");
  const formData = new FormData();
  
  // Create a Blob from the room image data
  const roomImageBlob = new Blob([new Uint8Array(roomImageData)], { type: 'image/jpeg' });
  formData.append('image', roomImageBlob, 'room_image.jpg');
  
  // According to Stability AI documentation, we need both prompt and search_prompt
  formData.append('prompt', prompt);  // The desired result
  formData.append('search_prompt', "room");  // What to look for in the image
  
  formData.append('seed', Math.floor(Math.random() * 2147483647).toString());
  formData.append('cfg_scale', '7');
  formData.append('samples', '1');
  
  // Reference image if provided
  if (referenceImageUrl) {
    try {
      const refImageData = await fetchImage(referenceImageUrl, "reference");
      
      // Check reference image size too
      const refSizeMB = refImageData.byteLength / (1024 * 1024);
      console.log(`Reference image size: ${refSizeMB.toFixed(2)}MB`);
      
      if (refSizeMB > 4) {
        console.warn(`Reference image is too large (${refSizeMB.toFixed(2)}MB). Skipping it.`);
      } else {
        const refImageBlob = new Blob([new Uint8Array(refImageData)], { type: 'image/jpeg' });
        formData.append('reference_image', refImageBlob, 'reference_image.jpg');
        console.log("Added reference image to the request");
      }
    } catch (refError) {
      console.error("Error processing reference image, continuing without it:", refError);
    }
  }
  
  // Log details about the request for better debugging
  console.log("Preparing request to Stability AI v2beta API");
  console.log("Using endpoint: search-and-replace");
  console.log("Prompt being sent:", prompt);
  console.log("Search prompt being sent: room");
  
  return formData;
}
