
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import { importFurnitureItems } from '@/services/furnitureService';

// Define the initial state for a new furniture item
export const initialItemState: Partial<FurnitureItem> = {
  name: '',
  category: '',
  description: '',
  image_url: '',
  resource_type: 'image' as 'image' | 'pdf' | 'url',
  external_url: '',
  pdf_url: '',
  price: 0,
};

export const useFurnitureItemManagement = (onItemsUpdate: () => void) => {
  const [currentItem, setCurrentItem] = useState<Partial<FurnitureItem>>(initialItemState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const openAddDialog = () => {
    setCurrentItem(initialItemState);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FurnitureItem) => {
    setCurrentItem(item);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const uploadFile = async (file: File, bucket: string = 'room-images', folder: string = 'furniture'): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
      
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
      console.error(error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem.name || !currentItem.category) {
      toast.error('Name and category are required');
      return;
    }

    if (currentItem.resource_type === 'url' && !currentItem.external_url) {
      toast.error('URL is required for web resources');
      return;
    }

    // For image resources, ensure we have an image URL
    if (currentItem.resource_type === 'image' && !currentItem.image_url) {
      toast.error('Image URL is required for image resources');
      return;
    }
    
    try {
      let itemData = {
        name: currentItem.name,
        category: currentItem.category,
        description: currentItem.description || '',
        image_url: currentItem.image_url || '',
        resource_type: currentItem.resource_type,
        external_url: currentItem.external_url || null,
        pdf_url: currentItem.pdf_url || null,
        price: currentItem.price || null,
      };
      
      if (isEditMode && currentItem.id) {
        const { error } = await supabase
          .from('furniture_items')
          .update(itemData)
          .eq('id', currentItem.id);
        
        if (error) throw error;
        toast.success('Furniture item updated successfully');
      } else {
        const { error } = await supabase
          .from('furniture_items')
          .insert(itemData);
        
        if (error) throw error;
        toast.success('Furniture item added successfully');
      }
      
      onItemsUpdate();
      closeDialog();
    } catch (error: any) {
      toast.error(`Failed to save furniture item: ${error.message}`);
      console.error(error);
    }
  };

  const handleBatchImport = async (items: Partial<FurnitureItem>[]) => {
    if (!items || items.length === 0) {
      toast.error('No valid items to import');
      return;
    }
    
    setIsBatchProcessing(true);
    
    try {
      const success = await importFurnitureItems(items);
      
      if (success) {
        onItemsUpdate();
        toast.success(`Successfully imported ${items.length} items`);
      }
    } catch (error: any) {
      toast.error(`Failed to import items: ${error.message}`);
      console.error(error);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('furniture_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Furniture item deleted successfully');
      onItemsUpdate();
    } catch (error: any) {
      toast.error(`Failed to delete furniture item: ${error.message}`);
      console.error(error);
    }
  };

  return {
    currentItem,
    setCurrentItem,
    isDialogOpen,
    isEditMode,
    isBatchProcessing,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    handleDelete,
    handleBatchImport
  };
};
