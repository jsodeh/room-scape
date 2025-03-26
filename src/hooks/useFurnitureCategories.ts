
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

export const useFurnitureCategories = () => {
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, fetch all furniture items
      const { data: furnitureItems, error: fetchError } = await supabase
        .from('furniture_items')
        .select('category');

      if (fetchError) {
        throw fetchError;
      }

      // Count occurrences of each category
      const categoryCounts: Record<string, number> = {};
      furnitureItems.forEach((item) => {
        const category = item.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // Transform to the expected format
      const transformedCategories: CategoryCount[] = [
        // Always include the "all" option first
        { id: 'all', name: 'All', count: furnitureItems.length },
        ...Object.entries(categoryCounts).map(([category, count]) => ({
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize the first letter
          count: count
        }))
      ];

      // Sort by count (descending)
      transformedCategories.sort((a, b) => {
        if (a.id === 'all') return -1; // Keep "all" at the top
        if (b.id === 'all') return 1;  
        return b.count - a.count;      // Sort others by count (descending)
      });

      setCategories(transformedCategories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setError(error.message);
      toast.error(`Failed to load furniture categories: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, isLoading, error, refreshCategories: fetchCategories };
};
