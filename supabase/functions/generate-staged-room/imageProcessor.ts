
import { supabase } from "./index.ts";
import { arrayBufferToBase64 } from "./utils.ts";

// Helper function to fetch images
export async function fetchImage(imageUrl: string, type: string): Promise<ArrayBuffer> {
  console.log(`Fetching ${type} image...`);
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const errorMsg = `Failed to fetch ${type} image: ${imageResponse.status} ${imageResponse.statusText}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  const imageData = await imageResponse.arrayBuffer();
  console.log(`${type} image fetched successfully, size:`, imageData.byteLength);
  return imageData;
}

// Process and save generated images from the v2beta API
export async function processAndSaveResultImages(
  artifacts: { image: string }[], 
  projectId: string
): Promise<string[]> {
  const stagedImages = [];
  
  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    
    // Decode base64 image
    const imageData = Uint8Array.from(atob(artifact.image), c => c.charCodeAt(0));
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileName = `staged-${projectId}-${timestamp}-${i}.png`;
    const filePath = `staged-images/${fileName}`;
    
    console.log(`Uploading image to Supabase Storage: ${filePath}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("room-images")
      .upload(filePath, imageData, {
        contentType: "image/png",
        upsert: true,
      });
    
    if (error) {
      console.error("Error uploading staged image:", error);
      throw error;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("room-images")
      .getPublicUrl(filePath);
    
    stagedImages.push(publicUrlData.publicUrl);
    console.log(`Image uploaded successfully. Public URL: ${publicUrlData.publicUrl}`);
  }
  
  return stagedImages;
}
