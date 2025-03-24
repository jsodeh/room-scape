
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import { toast } from 'sonner';

export const createFurnitureItem = async (itemData: Partial<FurnitureItem>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('furniture_items')
      .insert({
        name: itemData.name!,
        category: itemData.category!,
        description: itemData.description || '',
        image_url: itemData.image_url || '',
        resource_type: itemData.resource_type || 'image', 
        external_url: itemData.external_url || null,
        pdf_url: itemData.pdf_url || null,
        price: itemData.price || null,
      });
    
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error creating furniture item:', error);
    return false;
  }
};

export const updateFurnitureItem = async (
  id: string, 
  itemData: Partial<FurnitureItem>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('furniture_items')
      .update({
        name: itemData.name!,
        category: itemData.category!,
        description: itemData.description || '',
        image_url: itemData.image_url || '',
        resource_type: itemData.resource_type,
        external_url: itemData.external_url || null,
        pdf_url: itemData.pdf_url || null,
        price: itemData.price || null,
      })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error updating furniture item:', error);
    return false;
  }
};

export const deleteFurnitureItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('furniture_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error deleting furniture item:', error);
    return false;
  }
};
