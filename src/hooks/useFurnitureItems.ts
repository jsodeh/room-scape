
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';

export const useFurnitureItems = (
  categoryFilter: string = 'all',
  resourceTypeFilter: string = 'all'
) => {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFurnitureItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('furniture_items').select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (resourceTypeFilter !== 'all') {
        // Fix the type depth issue by using a more explicit type annotation
        const resourceType: string = resourceTypeFilter;
        query = query.eq('resource_type', resourceType);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFurniture(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch furniture items: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFurnitureItems();
  }, [categoryFilter, resourceTypeFilter]);

  return {
    furniture,
    isLoading,
    fetchFurnitureItems
  };
};
