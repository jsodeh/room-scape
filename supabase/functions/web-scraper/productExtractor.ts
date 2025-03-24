
// Extract product details from crawled pages
export function extractProductDetails(pages: any[]) {
  const products = [];
  
  for (const page of pages) {
    // Skip pages without content or images
    if (!page.content || !page.images || page.images.length === 0) continue;
    
    const title = page.title || getNameFromUrl(page.url);
    const description = extractDescription(page.content);
    const category = guessCategory(title, page.content);
    
    // Extract potential price information
    const price = extractPrice(page.content);
    
    // Extract specifications or features
    const specs = extractSpecifications(page.content);
    
    // Create a product entry for each image on the page
    for (const imageUrl of page.images) {
      if (isValidImageUrl(imageUrl)) {
        products.push({
          name: title,
          description,
          category,
          imageUrl,
          price,
          specifications: specs,
          pageUrl: page.url
        });
      }
    }
  }
  
  return products;
}

// Helper function to check if URL is a valid image
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    return path.endsWith('.jpg') || 
           path.endsWith('.jpeg') || 
           path.endsWith('.png') || 
           path.endsWith('.webp') || 
           path.endsWith('.gif');
  } catch {
    return false;
  }
}

// Helper functions
function getNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Get last path segment and convert to title case
      return pathParts[pathParts.length - 1]
        .replace(/-|_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    // Fallback to hostname
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unnamed Item';
  }
}

function extractDescription(content: string): string {
  // Find first paragraph or reasonable block of text
  if (!content) return '';
  
  // Get first 200 characters as description
  const cleanText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
    
  return cleanText.length > 200 
    ? cleanText.substring(0, 197) + '...' 
    : cleanText;
}

function guessCategory(name: string, content: string): string {
  const text = (name + ' ' + content).toLowerCase();
  
  // Simple category detection based on keywords
  if (text.includes('sofa') || text.includes('couch') || text.includes('sectional')) {
    return 'sofas';
  } else if (text.includes('table') || text.includes('desk')) {
    return 'tables';
  } else if (text.includes('chair') || text.includes('stool')) {
    return 'chairs';
  } else if (text.includes('bed') || text.includes('mattress')) {
    return 'beds';
  } else if (text.includes('shelf') || text.includes('cabinet') || text.includes('drawer')) {
    return 'storage';
  } else if (text.includes('lamp') || text.includes('light')) {
    return 'lighting';
  } else if (text.includes('rug') || text.includes('pillow') || text.includes('decor')) {
    return 'decor';
  }
  
  return 'decor'; // Default category
}

function extractPrice(content: string): string | null {
  if (!content) return null;
  
  // Common price patterns in USD
  const priceRegex = /\$\s?[\d,]+(\.\d{2})?|\$[\d,]+(\.\d{2})?/g;
  const matches = content.match(priceRegex);
  
  if (matches && matches.length > 0) {
    // Return the first match, cleaned up
    return matches[0].replace(/[^\d.]/g, '');
  }
  
  return null;
}

function extractSpecifications(content: string): Array<{name: string, value: string}> {
  if (!content) return [];
  
  const specs = [];
  
  // Look for common spec patterns like "Dimensions: 30 x 40 inches"
  const dimensionsRegex = /dimensions:?\s*([^\.]+)/i;
  const dimensionsMatch = content.match(dimensionsRegex);
  if (dimensionsMatch && dimensionsMatch[1]) {
    specs.push({ name: "Dimensions", value: dimensionsMatch[1].trim() });
  }
  
  // Look for materials
  const materialsRegex = /materials?:?\s*([^\.]+)/i;
  const materialsMatch = content.match(materialsRegex);
  if (materialsMatch && materialsMatch[1]) {
    specs.push({ name: "Materials", value: materialsMatch[1].trim() });
  }
  
  // Look for colors
  const colorsRegex = /colou?rs?:?\s*([^\.]+)/i;
  const colorsMatch = content.match(colorsRegex);
  if (colorsMatch && colorsMatch[1]) {
    specs.push({ name: "Colors", value: colorsMatch[1].trim() });
  }
  
  return specs;
}
