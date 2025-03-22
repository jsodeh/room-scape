
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfileData {
  full_name?: string;
  avatar_url?: string;
}

export const updateUserProfile = async (userId: string, userData: UserProfileData) => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: userData
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    toast.error(`Error updating profile: ${error.message}`);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    toast.error(`Error fetching profile: ${error.message}`);
    return null;
  }
};
