
import { FurnitureItem } from '@/types/database';

interface ImportedProduct {
  name: string;
  price: string | number;
  pictures: string[];
  categories: string[];
  product_link?: string;
  sub_categories?: string[];
  description?: string;
}

interface ImportResult {
  success: boolean;
  items: Partial<FurnitureItem>[];
  error?: string;
  stats?: {
    total: number;
    valid: number;
    invalid: number;
    reasons?: Record<string, number>;
  };
}

/**
 * Detect and parse different JSON structures containing product data
 */
const detectJsonStructure = (parsedData: any): ImportedProduct[] => {
  let products: ImportedProduct[] = [];
  
  if (Array.isArray(parsedData) && parsedData.length > 0) {
    if (parsedData[0].products && Array.isArray(parsedData[0].products)) {
      // Format: [{ products: [...] }]
      products = parsedData[0].products;
    } else if (parsedData[0].name || parsedData[0].pictures) {
      // Format: direct array of products
      products = parsedData;
    }
  } else if (parsedData.products && Array.isArray(parsedData.products)) {
    // Format: { products: [...] }
    products = parsedData.products;
  } else if (parsedData.data && Array.isArray(parsedData.data)) {
    // Format: { data: [...] }
    products = parsedData.data;
  } else if (parsedData.items && Array.isArray(parsedData.items)) {
    // Format: { items: [...] }
    products = parsedData.items;
  }
  
  return products;
};

/**
 * Validate a single product and return validation results
 */
const validateProduct = (product: ImportedProduct): { 
  valid: boolean;
  reason?: string;
} => {
  // Check for required fields
  if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
    return { valid: false, reason: 'missing_name' };
  }
  
  // Check for image
  if (!product.pictures || !Array.isArray(product.pictures) || product.pictures.length === 0) {
    return { valid: false, reason: 'missing_image' };
  }
  
  // Validate image URL
  const imageUrl = product.pictures[0];
  if (typeof imageUrl !== 'string' || !imageUrl.match(/^https?:\/\/.+/i)) {
    return { valid: false, reason: 'invalid_image_url' };
  }
  
  // Check for category
  const hasCategory = (product.categories && product.categories.length > 0) || 
                     (product.sub_categories && product.sub_categories.length > 0);
  
  if (!hasCategory) {
    return { valid: false, reason: 'missing_category' };
  }
  
  return { valid: true };
};

/**
 * Convert a single product to a furniture item
 */
export const convertProductToFurnitureItem = (product: ImportedProduct): Partial<FurnitureItem> => {
  // Extract the first category or use a default
  const category = product.categories && product.categories.length > 0 
    ? product.categories[0] 
    : (product.sub_categories && product.sub_categories.length > 0 
        ? product.sub_categories[0] 
        : 'Other');
        
  // Extract numeric price from string (e.g., "$1,390.00" to 1390) or use as is if already a number
  let numericPrice = 0;
  if (typeof product.price === 'string') {
    numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
  } else if (typeof product.price === 'number') {
    numericPrice = product.price;
  }
    
  // Use the first image as the main image
  const imageUrl = product.pictures && product.pictures.length > 0 
    ? product.pictures[0]
    : '';
    
  // Create description or use existing
  const description = product.description || 
    `Imported from ${product.product_link || 'external source'}. Price: ${product.price || 'N/A'}`;
    
  return {
    name: product.name,
    category,
    description,
    image_url: imageUrl,
    resource_type: 'image' as const,
    external_url: product.product_link || '',
    price: numericPrice
  };
};

/**
 * Parse and validate JSON content containing product data
 */
export const parseProductJson = (jsonContent: string): ImportResult => {
  try {
    // Parse JSON content
    const parsedData = JSON.parse(jsonContent);
    const products = detectJsonStructure(parsedData);
    
    if (products.length === 0) {
      return {
        success: false,
        items: [],
        error: 'No products found in the JSON data or unsupported format.',
        stats: { total: 0, valid: 0, invalid: 0 }
      };
    }
    
    console.log(`Found ${products.length} products in JSON data`);
    
    // Validate each product and collect statistics
    const validationResults = products.map(product => ({
      product,
      validation: validateProduct(product)
    }));
    
    // Collect validation statistics
    const reasons: Record<string, number> = {};
    validationResults.forEach(result => {
      if (!result.validation.valid && result.validation.reason) {
        reasons[result.validation.reason] = (reasons[result.validation.reason] || 0) + 1;
      }
    });
    
    // Filter valid products and convert to furniture items
    const validItems = validationResults
      .filter(result => result.validation.valid)
      .map(result => convertProductToFurnitureItem(result.product));
    
    const stats = {
      total: products.length,
      valid: validItems.length,
      invalid: products.length - validItems.length,
      reasons
    };
    
    console.log(`Validated ${validItems.length} out of ${products.length} items`);
    
    if (validItems.length === 0) {
      return {
        success: false,
        items: [],
        error: 'No valid items found. All items must have a name, category, and image URL.',
        stats
      };
    }
    
    return {
      success: true,
      items: validItems,
      stats
    };
  } catch (error: any) {
    console.error('JSON import error:', error);
    return {
      success: false,
      items: [],
      error: `Failed to parse JSON: ${error.message}`,
      stats: { total: 0, valid: 0, invalid: 0 }
    };
  }
};
