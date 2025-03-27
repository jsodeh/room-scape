
import { supabase } from "./supabaseClient.ts";

// Function to convert arraybuffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Validate required inputs
export function validateInputs(
  roomImageUrl: string,
  projectId: string,
  stabilityApiKey: string | undefined
): boolean {
  return !!(roomImageUrl && projectId && stabilityApiKey);
}

// Create a prompt based on user instructions and reference
export function createPrompt(instructions: string, referenceImageUrl?: string): string {
  let basePrompt = "Virtually stage this room: ";
  
  // Add user instructions if provided
  if (instructions && instructions.trim().length > 0) {
    basePrompt += `${instructions.trim()} `;
  } else {
    // Default staging instructions
    basePrompt += "Create a modern, stylish living space with appropriate furniture, decor, and lighting. ";
  }
  
  // Add reference image context if provided
  if (referenceImageUrl) {
    basePrompt += "Use the provided reference image as inspiration for the style and design. ";
  }
  
  // Add general guidance to ensure quality
  basePrompt += "Select appropriate furniture that fits the room's style and dimensions. Make sure the final image looks photorealistic and maintains the original room structure.";
  
  return basePrompt;
}
