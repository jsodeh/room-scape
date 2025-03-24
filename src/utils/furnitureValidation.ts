
import { FurnitureItem } from '@/types/database';
import { toast } from 'sonner';

export const validateFurnitureItem = (item: Partial<FurnitureItem>): boolean => {
  // Basic validation
  if (!item.name || !item.category) {
    return false;
  }

  // Resource type specific validation
  if (item.resource_type === 'url' && !item.external_url) {
    return false;
  }

  if (item.resource_type === 'image' && !item.image_url) {
    return false;
  }

  return true;
};

export const validateItemForSubmission = (item: Partial<FurnitureItem>): { valid: boolean; message?: string } => {
  if (!item.name || !item.category) {
    return { 
      valid: false, 
      message: 'Name and category are required' 
    };
  }

  if (item.resource_type === 'url' && !item.external_url) {
    return { 
      valid: false, 
      message: 'URL is required for web resources'
    };
  }

  if (item.resource_type === 'image' && !item.image_url) {
    return { 
      valid: false, 
      message: 'Image URL is required for image resources'
    };
  }
  
  return { valid: true };
};
