
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FurnitureItem } from '@/types/database';

// Fetch furniture items from the database
export const getFurnitureItems = async (category: string = 'all', resourceType: string = 'all'): Promise<FurnitureItem[]> => {
  try {
    // Start with base query
    let query = supabase.from('furniture_items').select('*');
    
    // Apply category filter if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Apply resource type filter if not 'all'
    if (resourceType !== 'all') {
      query = query.eq('resource_type', resourceType);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    toast.error(`Error fetching furniture items: ${error.message}`);
    console.error('Error fetching furniture items:', error);
    return [];
  }
};

// Validate a furniture item to ensure required fields are present
const validateFurnitureItem = (item: Partial<FurnitureItem>): boolean => {
  if (!item.name || !item.category || !item.image_url) {
    return false;
  }
  return true;
};

// Add a function to import multiple furniture items at once
export const importFurnitureItems = async (items: Partial<FurnitureItem>[]): Promise<boolean> => {
  try {
    if (!items || items.length === 0) {
      throw new Error('No items to import');
    }
    
    // Filter out invalid items and convert to the correct format
    const validItems = items
      .filter(validateFurnitureItem)
      .map(item => ({
        name: item.name!,
        category: item.category!,
        image_url: item.image_url!,
        description: item.description || '',
        resource_type: item.resource_type || 'image',
        external_url: item.external_url || null,
        pdf_url: item.pdf_url || null,
        price: item.price || null
      }));
    
    if (validItems.length === 0) {
      throw new Error('No valid items to import. Items must have name, category, and image_url.');
    }
    
    console.log(`Attempting to import ${validItems.length} furniture items`, validItems);
    
    const { error } = await supabase
      .from('furniture_items')
      .insert(validItems);
    
    if (error) {
      console.error('Error during furniture import:', error);
      throw error;
    }
    
    toast.success(`Successfully imported ${validItems.length} furniture items`);
    return true;
  } catch (error: any) {
    toast.error(`Error importing furniture items: ${error.message}`);
    console.error('Error importing furniture items:', error);
    return false;
  }
};
