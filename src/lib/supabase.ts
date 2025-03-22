
import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in your project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type FurnitureItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  created_at?: string;
};

export type StagingProject = {
  id: string;
  user_id: string;
  instructions: string;
  furniture_ids: string[];
  original_images: string[];
  staged_images: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      furniture_items: {
        Row: FurnitureItem;
        Insert: Omit<FurnitureItem, 'id' | 'created_at'>;
        Update: Partial<Omit<FurnitureItem, 'id' | 'created_at'>>;
      };
      staging_projects: {
        Row: StagingProject;
        Insert: Omit<StagingProject, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StagingProject, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
