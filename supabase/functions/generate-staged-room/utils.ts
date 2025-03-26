
// Validate required inputs for image generation
export function validateInputs(roomImageUrl: string, projectId: string, apiKey: string): boolean {
  if (!roomImageUrl) {
    console.error("Missing required input: roomImageUrl");
    return false;
  }
  
  if (!projectId) {
    console.error("Missing required input: projectId");
    return false;
  }
  
  if (!apiKey) {
    console.error("Missing required API key for image generation");
    return false;
  }
  
  return true;
}

// Create a comprehensive prompt for the image generation
export function createPrompt(instructions: string, referenceImageUrl?: string): string {
  let basePrompt = instructions || "Stage this room as a modern living room with clean lines and a neutral color palette. Include a comfortable sofa, coffee table, and minimal decor. Add subtle accent pieces for visual interest.";
  
  // Add explicit staging instructions if not already included
  if (!basePrompt.toLowerCase().includes("stage this room")) {
    basePrompt = "Virtually stage this room: " + basePrompt;
  }
  
  // Add specific instructions for photorealism and structure preservation
  let fullPrompt = `${basePrompt} Select appropriate furniture that fits the room's style and dimensions. Make sure the final image looks photorealistic and maintains the original room structure.`;
  
  if (referenceImageUrl) {
    fullPrompt += " Use the provided reference image for style inspiration.";
  }
  
  return fullPrompt;
}
