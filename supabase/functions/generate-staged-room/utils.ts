
// Validate that required inputs are provided
export function validateInputs(roomImageUrl: string, projectId: string, apiKey: string): boolean {
  return !!(roomImageUrl && projectId && apiKey);
}

// Create the final prompt for guiding image generation
export function createPrompt(instructions: string, referenceStyle: string | null): string {
  let prompt = "Virtually stage this room: ";
  
  if (instructions && instructions.trim().length > 0) {
    prompt += instructions;
  } else {
    prompt += "Create a modern, welcoming living space with appropriate furniture that fits the room's style and dimensions. Make sure the final image looks photorealistic and maintains the original room structure.";
  }
  
  // Note: referenceStyle is not being used anymore as per updated design
  
  return prompt;
}

// Convert ArrayBuffer to base64 string in a memory-efficient way
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  let binary = '';
  
  // Process the array in chunks to avoid stack overflow
  const CHUNK_SIZE = 1024;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, Math.min(i + CHUNK_SIZE, len));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  return btoa(binary);
}

// Format timestamp for consistent logging
export function getFormattedTimestamp(): string {
  return new Date().toISOString();
}

// Extract filename from URL
export function getFilenameFromUrl(url: string): string {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
}
