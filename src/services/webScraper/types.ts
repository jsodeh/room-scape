
export interface CrawlOptions {
  url: string;
  limit?: number;
}

export interface ScrapedFurnitureItem {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  price?: string;
  specifications?: Array<{name: string, value: string}>;
  pageUrl?: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  images: string[];
}

export interface CrawlResult {
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
