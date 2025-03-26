
// Validation function
export function validateInputs(roomImageUrl: string, projectId: string, stabilityApiKey: string | undefined) {
  if (!roomImageUrl) {
    console.error("Room image URL is required");
    return false;
  }

  if (!projectId) {
    console.error("Project ID is required");
    return false;
  }

  if (!stabilityApiKey) {
    console.error("STABILITY_API_KEY is not configured");
    return false;
  }

  return true;
}

// Create prompt based on inputs
export function createPrompt(
  instructions: string | undefined, 
  furnitureUrls: string[] | undefined, 
  referenceImageUrl: string | undefined
): string {
  let prompt = "Virtually stage this room";
  
  // If user provided instructions, use them as the primary guide
  if (instructions && instructions.trim().length > 0) {
    prompt += `: ${instructions}`;
  } else {
    // Default instructions if none provided
    prompt += " with modern, stylish furniture. Create an inviting space with appropriate furnishings.";
  }
  
  // Add furniture details if available
  if (furnitureUrls && furnitureUrls.length > 0) {
    if (!instructions || !instructions.includes("furniture")) {
      prompt += ". Include the following furniture items:";
      for (const url of furnitureUrls) {
        // Extract furniture name from URL or use generic description
        const furnitureName = url.split('/').pop()?.split('.')[0]?.replace(/-/g, ' ') || "selected item";
        prompt += ` ${furnitureName},`;
      }
      prompt = prompt.slice(0, -1); // Remove trailing comma
    }
  } else {
    // When no furniture is explicitly selected, enhance the prompt to use appropriate furniture
    if (!instructions || !instructions.includes("furniture")) {
      prompt += ". Select appropriate furniture that fits the room's style and dimensions.";
    }
  }

  if (referenceImageUrl) {
    prompt += ". Use the provided reference image as a style guide for the staging.";
  }

  prompt += ". Make sure the final image looks photorealistic and maintains the original room structure.";
  
  return prompt;
}

// Convert ArrayBuffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
