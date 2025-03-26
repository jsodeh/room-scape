
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
      // Get unique categories with item counts
      const { data, error } = await supabase
        .from('furniture_items')
        .select('category, count(*)')
        .group('category')
        .order('count', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform to the expected format
      const transformedCategories: CategoryCount[] = [
        // Always include the "all" option first
        { id: 'all', name: 'All', count: 0 },
        ...data.map(item => ({
          id: item.category,
          name: item.category.charAt(0).toUpperCase() + item.category.slice(1), // Capitalize the first letter
          count: parseInt(item.count)
        }))
      ];

      // Update the count for "All"
      const totalItems = transformedCategories.reduce((sum, cat) => cat.id === 'all' ? sum : sum + cat.count, 0);
      transformedCategories[0].count = totalItems;

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
