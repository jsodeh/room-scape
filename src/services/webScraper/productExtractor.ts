
import { CrawlResult, ScrapedFurnitureItem } from './types';
import { getNameFromUrl, extractDescription, guessCategory } from './utils';

/**
 * Extracts furniture items from crawl results
 */
export function extractFurnitureItems(crawlResult: CrawlResult): ScrapedFurnitureItem[] {
  if (!crawlResult.success || !crawlResult.data) {
    return [];
  }
  
  // Use pre-extracted products from the edge function if available
  if (crawlResult.data.extractedProducts && crawlResult.data.extractedProducts.length > 0) {
    console.log(`Using ${crawlResult.data.extractedProducts.length} pre-extracted products from edge function`);
    return crawlResult.data.extractedProducts;
  }
  
  // Fallback to manual extraction if needed
  const items: ScrapedFurnitureItem[] = [];
  console.log('Extracting furniture items from crawl result');
  
  // Process each page from the crawl result
  if (crawlResult.data.pages) {
    crawlResult.data.pages.forEach(page => {
      // Get images from the page
      const images = page.images || [];
      
      if (images.length > 0) {
        // Create a furniture item for each image found
        images.forEach(imageUrl => {
          // Extract name from page title or URL
          const name = page.title || getNameFromUrl(page.url);
          
          items.push({
            name,
            description: extractDescription(page.content),
            imageUrl,
            category: guessCategory(name, page.content)
          });
        });
      } else {
        console.log(`No images found on page: ${page.url}`);
      }
    });
  }
  
  console.log(`Extracted ${items.length} furniture items`);
  return items;
}
