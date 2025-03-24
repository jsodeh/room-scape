
import { FurnitureItem } from '@/types/database';

interface ImportedProduct {
  name: string;
  price: string;
  pictures: string[];
  categories: string[];
  product_link: string;
  sub_categories: string[];
}

interface ImportResult {
  success: boolean;
  items: Partial<FurnitureItem>[];
  error?: string;
}

/**
 * Parse and validate JSON content containing product data
 */
export const parseProductJson = (jsonContent: string): ImportResult => {
  try {
    // Parse JSON content
    const parsedData = JSON.parse(jsonContent);
    let products: ImportedProduct[] = [];
    
    // Handle different JSON structures
    if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].products) {
      // Format: [{ products: [...] }]
      products = parsedData[0].products;
    } else if (Array.isArray(parsedData)) {
      // Format: direct array of products
      products = parsedData;
    } else if (parsedData.products && Array.isArray(parsedData.products)) {
      // Format: { products: [...] }
      products = parsedData.products;
    } else {
      throw new Error('Unsupported JSON format. Expected an array of products or an object with a products array.');
    }
    
    if (products.length === 0) {
      throw new Error('No products found in the JSON data.');
    }
    
    // Transform the product data to our furniture format
    const furnitureItems = products.map(product => {
      // Extract the first category or use a default
      const category = product.categories && product.categories.length > 0 
        ? product.categories[0] 
        : (product.sub_categories && product.sub_categories.length > 0 
            ? product.sub_categories[0] 
            : 'Other');
            
      // Extract numeric price from string (e.g., "$1,390.00" to 1390)
      const numericPrice = product.price 
        ? parseFloat(product.price.replace(/[^0-9.]/g, '')) 
        : 0;
        
      // Use the first image as the main image
      const imageUrl = product.pictures && product.pictures.length > 0 
        ? product.pictures[0]
        : '';
        
      return {
        name: product.name || 'Unnamed Product',
        category,
        description: `Imported from ${product.product_link || 'external source'}. Price: ${product.price || 'N/A'}`,
        image_url: imageUrl,
        resource_type: 'image' as const,
        external_url: product.product_link || '',
        price: numericPrice
      };
    });
    
    // Filter out items without images
    const validItems = furnitureItems.filter(item => item.image_url);
    
    return {
      success: true,
      items: validItems
    };
  } catch (error: any) {
    console.error('JSON import error:', error);
    return {
      success: false,
      items: [],
      error: error.message
    };
  }
};

/**
 * Convert a single product to a furniture item
 */
export const convertProductToFurnitureItem = (product: ImportedProduct): Partial<FurnitureItem> => {
  const category = product.categories?.[0] || product.sub_categories?.[0] || 'Other';
  const numericPrice = product.price 
    ? parseFloat(product.price.replace(/[^0-9.]/g, '')) 
    : 0;
  const imageUrl = product.pictures?.[0] || '';
  
  return {
    name: product.name || 'Unnamed Product',
    category,
    description: `Imported from ${product.product_link || 'external source'}. Price: ${product.price || 'N/A'}`,
    image_url: imageUrl,
    resource_type: 'image',
    external_url: product.product_link || '',
    price: numericPrice
  };
};
