
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
  };
  error?: string;
}

export const webScraperService = {
  crawlWebsite: async (options: CrawlOptions): Promise<CrawlResult> => {
    try {
      const { url, limit = 100 } = options;
      
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          url,
          limit,
          formats: ['markdown', 'html']
        }
      });
      
      if (error) {
        console.error('Error calling web-scraper function:', error);
        toast.error('Failed to crawl website');
        return { success: false, data: null, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error in crawlWebsite:', error);
      toast.error('Failed to crawl website');
      return { success: false, data: null, error: error.message };
    }
  },
  
  extractFurnitureItems: (crawlResult: CrawlResult): ScrapedFurnitureItem[] => {
    if (!crawlResult.success || !crawlResult.data || !crawlResult.data.pages) {
      return [];
    }
    
    const items: ScrapedFurnitureItem[] = [];
    
    // Process each page from the crawl result
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
      }
    });
    
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
