
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StagingProject } from '@/types/database';

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

// Generate staged images using Stability AI
export const generateStagedImages = async (
  projectId: string,
  roomImageUrl: string,
  furnitureUrls: string[],
  instructions: string
) => {
  try {
    const { data, error } = await supabase.functions
      .invoke('generate-staged-room', {
        body: {
          projectId,
          roomImageUrl,
          furnitureUrls,
          instructions
        }
      });
    
    if (error) {
      throw error;
    }
    
    return data.project;
  } catch (error: any) {
    toast.error(`Error generating staged images: ${error.message}`);
    console.error('Error generating staged images:', error);
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
