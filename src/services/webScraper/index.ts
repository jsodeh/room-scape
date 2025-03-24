
import { crawlWebsite } from './crawlerService';
import { extractFurnitureItems } from './productExtractor';
import type { 
  CrawlOptions, 
  CrawlResult, 
  ScrapedFurnitureItem, 
  ScrapedPage 
} from './types';

// Export the main service methods
export const webScraperService = {
  crawlWebsite,
  extractFurnitureItems
};

// Export types for consumers
export type {
  CrawlOptions,
  CrawlResult,
  ScrapedFurnitureItem,
  ScrapedPage
};
