
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
export const uploadImage = async (file: File, folder?: string): Promise<string | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Sign in before uploading a file.');
    // Use room-images bucket for all images
    const targetBucket = 'room-images';
    
    // Use the folder parameter to organize images within the bucket
    const targetFolder = folder || getBucketForFile(file);
    
    const fileName = generateUniqueFileName(file);
    const filePath = `${user.id}/${targetFolder}/${fileName}`;
    
    console.log(`Uploading to bucket: ${targetBucket}, path: ${filePath}`);
    
    const { error, data } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file);
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);
    
    console.log('Upload successful, URL:', publicUrl.publicUrl);
    return publicUrl.publicUrl;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    toast.error(`Error uploading file: ${error.message}`);
    return null;
  }
};

// Upload multiple files and return their URLs
export const uploadMultipleImages = async (files: File[], folder?: string): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  } catch (error: any) {
    toast.error(`Error uploading files: ${error.message}`);
    console.error('Error uploading multiple files:', error);
    return [];
  }
};
