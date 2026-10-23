
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const uploadFile = async (
  file: File, 
  bucket: string = 'room-images', 
  folder: string = 'furniture'
): Promise<string | null> => {
  if (!file) return null;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Sign in before uploading a file.');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${folder}/${fileName}`;
    
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
