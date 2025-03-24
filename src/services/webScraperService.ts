
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CrawlOptions {
  url: string;
  limit?: number;
}

interface ScrapedFurnitureItem {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  price?: string;
  specifications?: Array<{name: string, value: string}>;
  pageUrl?: string;
}

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  images: string[];
}

interface CrawlResult {
  success: boolean;
  data: {
    status: string;
    completed: number;
    total: number;
    pages: ScrapedPage[];
    extractedProducts?: ScrapedFurnitureItem[];
  };
  error?: string;
}

export const webScraperService = {
  crawlWebsite: async (options: CrawlOptions): Promise<CrawlResult> => {
    try {
      const { url, limit = 100 } = options;
      
      console.log('Calling web-scraper function with URL:', url);
      const response = await supabase.functions.invoke('web-scraper', {
        body: {
          url,
          limit,
          formats: ['markdown', 'html']
        }
      });
      
      if (response.error) {
        console.error('Error calling web-scraper function:', response.error);
        toast.error('Failed to crawl website: ' + response.error.message);
        return { 
          success: false, 
          data: { status: 'error', completed: 0, total: 0, pages: [] }, 
          error: response.error.message 
        };
      }
      
      // Check if the data structure is as expected
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.error || 'Unknown error occurred';
        console.error('Web scraper returned error:', errorMessage);
        toast.error('Failed to crawl website: ' + errorMessage);
        return { 
          success: false, 
          data: { status: 'error', completed: 0, total: 0, pages: [] }, 
          error: errorMessage 
        };
      }
      
      // If we got here, the response was successful
      console.log('Crawl result:', response.data);
      
      // Check if we have actual crawled data
      if (!response.data.data || !response.data.data.pages || response.data.data.pages.length === 0) {
        console.warn('No pages found in crawl result');
        toast.warning('No content was found on the provided website');
        return {
          success: true,
          data: {
            status: 'completed',
            completed: 0,
            total: 0,
            pages: []
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in crawlWebsite:', error);
      toast.error('Failed to crawl website: ' + (error.message || 'Unknown error'));
      return { 
        success: false, 
        data: { status: 'error', completed: 0, total: 0, pages: [] }, 
        error: error.message 
      };
    }
  },
  
  extractFurnitureItems: (crawlResult: CrawlResult): ScrapedFurnitureItem[] => {
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
};

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
