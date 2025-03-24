
import { useState } from 'react';
import { toast } from 'sonner';
import { FurnitureItem } from '@/types/database';
import { importFurnitureItems } from '@/services/furnitureService';
import { uploadFile } from '@/services/fileUploadService';
import { validateItemForSubmission } from '@/utils/furnitureValidation';
import { createFurnitureItem, updateFurnitureItem, deleteFurnitureItem } from '@/services/furnitureOperations';

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

  // Dialog management functions
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

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateItemForSubmission(currentItem);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    try {
      let success: boolean;
      
      if (isEditMode && currentItem.id) {
        success = await updateFurnitureItem(currentItem.id, currentItem);
        if (success) {
          toast.success('Furniture item updated successfully');
        }
      } else {
        success = await createFurnitureItem(currentItem);
        if (success) {
          toast.success('Furniture item added successfully');
        }
      }
      
      if (success) {
        onItemsUpdate();
        closeDialog();
      }
    } catch (error: any) {
      toast.error(`Failed to save furniture item: ${error.message}`);
      console.error(error);
    }
  };

  // Batch import handler
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

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const success = await deleteFurnitureItem(id);
      
      if (success) {
        toast.success('Furniture item deleted successfully');
        onItemsUpdate();
      }
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
    handleBatchImport,
    uploadFile
  };
};
