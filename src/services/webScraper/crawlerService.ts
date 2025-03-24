
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CrawlOptions, CrawlResult } from './types';

/**
 * Crawls a website using the Supabase Edge Function
 */
export async function crawlWebsite(options: CrawlOptions): Promise<CrawlResult> {
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
}
