
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generate a unique filename with original extension
const generateUniqueFileName = (file: File): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Upload an image to Supabase storage
export const uploadImage = async (file: File, bucket: string = 'room-images'): Promise<string | null> => {
  try {
    const fileName = generateUniqueFileName(file);
    const filePath = `${bucket}/${fileName}`;
    
    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
    
    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrl.publicUrl;
  } catch (error: any) {
    toast.error(`Error uploading image: ${error.message}`);
    console.error('Error uploading image:', error);
    return null;
  }
};

// Upload multiple images and return their URLs
export const uploadMultipleImages = async (files: File[], bucket: string = 'room-images'): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, bucket));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  } catch (error: any) {
    toast.error(`Error uploading images: ${error.message}`);
    console.error('Error uploading multiple images:', error);
    return [];
  }
};
