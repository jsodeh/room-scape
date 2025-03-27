
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
  
  // Create a Blob from the room image data - THIS IS THE PRIMARY IMAGE TO BE TRANSFORMED
  // Ensure this is the main image that will be staged (not the reference image)
  const roomImageBlob = new Blob([new Uint8Array(roomImageData)], { type: 'image/jpeg' });
  formData.append('image', roomImageBlob, 'room_image.jpg');
  
  // According to Stability AI documentation for search-and-replace endpoint
  // We need to add the prompt and search_prompt parameters
  formData.append('prompt', prompt);  // What we want to replace with
  formData.append('search_prompt', "room, interior");  // What to look for in the image
  
  // Add standard parameters per Stability AI docs
  formData.append('seed', Math.floor(Math.random() * 2147483647).toString());
  formData.append('cfg_scale', '7');  // Guidance scale - how strictly to follow the prompt
  formData.append('samples', '1');    // Number of images to generate
  
  // More verbose debug info
  console.log("Request parameters:");
  console.log(`- Prompt: "${prompt}"`);
  console.log(`- Search prompt: "room, interior"`);
  console.log(`- Seed: ${formData.get('seed')}`);
  console.log(`- CFG Scale: ${formData.get('cfg_scale')}`);
  console.log(`- Samples: ${formData.get('samples')}`);
  
  // Reference image if provided - only include if under size limit
  // The reference image should only influence the style, not be the main image to transform
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
        
        // Use the correct parameter name for reference image
        // This ensures it's used as style reference, not as the main image
        formData.append('reference_image', refImageBlob, 'reference_image.jpg');
        console.log("Added reference image to the request as style reference only");
      }
    } catch (refError) {
      console.error("Error processing reference image, continuing without it:", refError);
    }
  }
  
  // Log details about the request for better debugging
  console.log("Preparing request to Stability AI v2beta API");
  console.log("Using endpoint: search-and-replace");
  
  return formData;
}
