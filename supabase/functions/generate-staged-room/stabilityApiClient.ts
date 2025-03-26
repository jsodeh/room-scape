
export class StabilityApiClient {
  private apiKey: string;
  private baseUrl = "https://api.stability.ai";
  private endpoint = "/v2beta/stable-image/edit/search-and-replace";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateImage(formData: FormData): Promise<any> {
    console.log("Sending request to Stability API now...");
    
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout reached, aborting");
      controller.abort();
    }, 30000); // 30 second timeout for large images
    
    try {
      // Make request to Stability AI v2beta API with correct Accept header
      const response = await fetch(
        `${this.baseUrl}${this.endpoint}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            // Accept header set per Stability API docs
            "Accept": "application/json"
          },
          body: formData,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      console.log(`Stability API response status: ${response.status}`);
      
      // Enhanced error logging with full details
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Stability API error response (${response.status}):`, responseText);
        console.error(`Request URL: ${this.baseUrl}${this.endpoint}`);
        
        let errorMessage = `Stability API error (status ${response.status})`;
        let errorDetails = "";
        
        try {
          // Try to parse as JSON for more specific error message
          const errorJson = JSON.parse(responseText);
          if (errorJson.message) {
            errorDetails = errorJson.message;
          } else if (errorJson.errors && errorJson.errors.length > 0) {
            errorDetails = errorJson.errors.join(', ');
          } else {
            errorDetails = responseText.substring(0, 200);
          }
        } catch (e) {
          // If not valid JSON, use text
          errorDetails = responseText.substring(0, 200);
        }
        
        errorMessage += `: ${errorDetails}`;
        console.error(errorMessage);
        
        // Specific messaging for common error codes
        if (response.status === 401) {
          throw new Error("Authentication failed: Invalid Stability API key. Please check your API key in Supabase secrets.");
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorDetails}. Check image format and prompt.`);
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else {
          throw new Error(errorMessage);
        }
      }
      
      console.log("Processing successful response from Stability API");
      
      // Parse the response and log structure for debugging
      const result = await response.json();
      console.log("Stability API response full structure:", JSON.stringify(result, null, 2));
      console.log("Top level keys in response:", Object.keys(result));
      
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError.name, fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Stability API request timed out. The image may be too large or complex. Please try again with a smaller image or simplify your request.");
      }
      throw fetchError;
    }
  }
}
