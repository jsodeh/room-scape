
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface FeedbackData {
  rating: number;
  comments?: string;
}

export const submitProjectFeedback = async (projectId: string, feedbackData: FeedbackData) => {
  try {
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to submit feedback');
    }
    
    const { error } = await supabase
      .from('project_feedback')
      .insert({
        project_id: projectId,
        user_id: user.id,
        rating: feedbackData.rating,
        comments: feedbackData.comments,
      });
    
    if (error) {
      throw error;
    }
    
    // Update the project to mark that feedback has been provided
    await supabase
      .from('staging_projects')
      .update({ has_feedback: true })
      .eq('id', projectId);
    
    return true;
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    toast.error(`Error submitting feedback: ${error.message}`);
    throw error;
  }
};

export const getProjectFeedback = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('project_feedback')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Error fetching project feedback:', error);
    return null;
  }
};
