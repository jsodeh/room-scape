
import { supabase } from '@/lib/supabase';
import { FurnitureItem } from '@/lib/supabase';
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

// Fetch furniture items from the database
export const getFurnitureItems = async (category: string = 'all'): Promise<FurnitureItem[]> => {
  try {
    let query = supabase
      .from('furniture_items')
      .select('*');
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    toast.error(`Error fetching furniture items: ${error.message}`);
    console.error('Error fetching furniture items:', error);
    return [];
  }
};

// Create a new staging project
export const createStagingProject = async (
  userId: string,
  instructions: string,
  furnitureIds: string[],
  originalImageUrls: string[]
) => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .insert({
        user_id: userId,
        instructions,
        furniture_ids: furnitureIds,
        original_images: originalImageUrls,
        staged_images: [],
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    toast.error(`Error creating staging project: ${error.message}`);
    console.error('Error creating staging project:', error);
    return null;
  }
};

// Get staging project by ID
export const getStagingProject = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    toast.error(`Error fetching staging project: ${error.message}`);
    console.error('Error fetching staging project:', error);
    return null;
  }
};

// Get all staging projects for a user
export const getUserStagingProjects = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    toast.error(`Error fetching user staging projects: ${error.message}`);
    console.error('Error fetching user staging projects:', error);
    return [];
  }
};
