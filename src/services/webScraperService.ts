
// This file is being maintained for backward compatibility
// Import and re-export from the new module structure
import { webScraperService } from './webScraper';

export { webScraperService };
export type {
  CrawlOptions,
  CrawlResult,
  ScrapedFurnitureItem,
  ScrapedPage
} from './webScraper';
