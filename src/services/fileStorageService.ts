
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generate a unique filename with original extension
const generateUniqueFileName = (file: File): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Determine appropriate bucket based on file type
const getBucketForFile = (file: File): string => {
  if (file.type === 'application/pdf') {
    return 'document-files';
  }
  return 'room-images';
};

// Upload an image or PDF to Supabase storage
export const uploadImage = async (file: File, bucket?: string): Promise<string | null> => {
  try {
    // If no bucket is specified, determine based on file type
    const targetBucket = bucket || getBucketForFile(file);
    
    const fileName = generateUniqueFileName(file);
    const filePath = `${targetBucket}/${fileName}`;
    
    const { error, data } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file);
    
    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);
    
    return publicUrl.publicUrl;
  } catch (error: any) {
    toast.error(`Error uploading file: ${error.message}`);
    console.error('Error uploading file:', error);
    return null;
  }
};

// Upload multiple files and return their URLs
export const uploadMultipleImages = async (files: File[], bucket?: string): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, bucket));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  } catch (error: any) {
    toast.error(`Error uploading files: ${error.message}`);
    console.error('Error uploading multiple files:', error);
    return [];
  }
};
