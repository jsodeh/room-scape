
import { supabase } from "./supabaseClient.ts";
import { arrayBufferToBase64 } from "./utils.ts";
import { fetchAsset } from "../_shared/security.ts";

// Helper function to fetch images
export async function fetchImage(imageUrl: string, type: string): Promise<ArrayBuffer> {
  console.log(`Fetching ${type} image...`);
  const { data: imageData } = await fetchAsset(imageUrl);
  console.log(`${type} image fetched successfully, size:`, imageData.byteLength);
  return imageData;
}

// Process and save generated images from the v2beta API
export async function processAndSaveResultImages(
  artifacts: { image: string }[], 
  projectId: string
): Promise<string[]> {
  const stagedImages = [];
  const { data: project, error: projectError } = await supabase.from('staging_projects')
    .select('user_id').eq('id', projectId).single();
  if (projectError || !project) throw new Error('Project owner could not be resolved.');
  
  console.log(`Processing ${artifacts.length} image artifacts`);
  
  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    
    // Verify the image data exists and is valid
    if (!artifact.image && typeof artifact !== 'string') {
      console.error(`Image data missing for artifact ${i}:`, artifact);
      continue;
    }
    
    try {
      // Handle both string format and object format
      let base64Data = typeof artifact === 'string' ? artifact : artifact.image;
      
      console.log(`Processing artifact ${i}, image data type:`, typeof base64Data);
      
      // Remove data URL prefix if present
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      
      // Decode base64 image
      const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `staged-${projectId}-${timestamp}-${i}.png`;
      const filePath = `${project.user_id}/staged-images/${fileName}`;
      
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
    } catch (error) {
      console.error(`Error processing artifact ${i}:`, error);
    }
  }
  
  console.log(`Successfully processed ${stagedImages.length} out of ${artifacts.length} images`);
  
  if (stagedImages.length === 0 && artifacts.length > 0) {
    throw new Error("Failed to process any of the images returned by Stability AI");
  }
  
  return stagedImages;
}
