
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

// Add a function to import multiple furniture items at once
export const importFurnitureItems = async (items: Partial<FurnitureItem>[]): Promise<boolean> => {
  try {
    if (!items || items.length === 0) {
      throw new Error('No items to import');
    }
    
    // Remove any id fields as we want Supabase to generate new ones
    const itemsToInsert = items.map(({ id, ...item }) => item);
    
    const { error } = await supabase
      .from('furniture_items')
      .insert(itemsToInsert);
    
    if (error) {
      throw error;
    }
    
    toast.success(`Successfully imported ${items.length} furniture items`);
    return true;
  } catch (error: any) {
    toast.error(`Error importing furniture items: ${error.message}`);
    console.error('Error importing furniture items:', error);
    return false;
  }
};
