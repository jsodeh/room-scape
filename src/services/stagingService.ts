
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StagingProject } from '@/types/database';

// Type guard to ensure status conforms to our union type
const validateProjectStatus = (status: string): 'pending' | 'processing' | 'completed' | 'failed' => {
  if (status === 'pending' || status === 'processing' || status === 'completed' || status === 'failed') {
    return status;
  }
  return 'pending'; // Default fallback
};

// Create a new staging project
export const createStagingProject = async (
  userId: string,
  instructions: string,
  furnitureIds: string[],
  originalImageUrls: string[],
  referenceImageUrl?: string
) => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .insert({
        user_id: userId,
        instructions,
        furniture_ids: furnitureIds,
        original_images: originalImageUrls,
        reference_image: referenceImageUrl,
        staged_images: [],
        status: 'pending',
        error_message: null,
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

// Generate staged images using Gemini
export const generateStagedImages = async (
  projectId: string,
  roomImageUrl: string,
  instructions: string,
  referenceImageUrl?: string
) => {
  try {
    // Log the request details for debugging
    console.log('Generating staged images with:');
    console.log('- Project ID:', projectId);
    console.log('- Room image URL:', roomImageUrl);
    console.log('- Instructions length:', instructions.length);
    console.log('- Reference image URL:', referenceImageUrl || 'none');
    
    // Store the reference image in the project for future use,
    // but don't pass it to the staging API call
    if (referenceImageUrl) {
      await supabase
        .from('staging_projects')
        .update({ reference_image: referenceImageUrl })
        .eq('id', projectId);
    }
    
    const { data, error } = await supabase.functions
      .invoke('generate-staged-room', {
        body: {
          projectId,
          roomImageUrl,
          instructions
          // No longer passing referenceImageUrl here
        }
      });
    
    if (error) {
      console.error('Edge function error:', error);
      // Update the project with error info
      await supabase
        .from('staging_projects')
        .update({ 
          status: 'failed',
          error_message: `Edge function error: ${error.message}`
        })
        .eq('id', projectId);
      
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
export const getStagingProject = async (projectId: string): Promise<StagingProject | null> => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Ensure the status conforms to our type
    return {
      ...data,
      status: validateProjectStatus(data.status)
    };
  } catch (error: any) {
    console.error('Error fetching staging project:', error);
    return null;
  }
};

// Get all staging projects for a user
export const getUserStagingProjects = async (userId: string): Promise<StagingProject[]> => {
  try {
    const { data, error } = await supabase
      .from('staging_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Ensure all project statuses conform to our type
    return (data || []).map(project => ({
      ...project,
      status: validateProjectStatus(project.status)
    }));
  } catch (error: any) {
    toast.error(`Error fetching user staging projects: ${error.message}`);
    console.error('Error fetching user staging projects:', error);
    return [];
  }
};
