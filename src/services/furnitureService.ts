
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FurnitureItem } from '@/types/database';

// Fetch furniture items from the database
export const getFurnitureItems = async (category: string = 'all'): Promise<FurnitureItem[]> => {
  try {
    let query = supabase
      .from('furniture_items')
      .select('*');
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
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
