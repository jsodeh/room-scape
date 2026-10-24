
import { fetchImage } from "./imageProcessor.ts";

// Prepare the request data for Stability API
export async function prepareStabilityRequest(
  roomImageData: ArrayBuffer,
  prompt: string
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
  formData.append('output_format', 'png');
  
  // More verbose debug info
  console.log("Request parameters:");
  console.log(`- Prompt: "${prompt}"`);
  console.log(`- Search prompt: "room, interior"`);
  console.log(`- Seed: ${formData.get('seed')}`);
  console.log(`- CFG Scale: ${formData.get('cfg_scale')}`);
  console.log(`- Samples: ${formData.get('samples')}`);
  
  // Log details about the request for better debugging
  console.log("Preparing request to Stability AI v2beta API");
  console.log("Using endpoint: search-and-replace");
  
  return formData;
}
