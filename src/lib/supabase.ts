
import { createClient } from '@supabase/supabase-js';

// Check for environment variables or use demo values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbHprdnl5a2VqeXVzenlvbmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTUyMzcwMTAsImV4cCI6MTk3MDgxMzAxMH0.aI1SruPYq-wPGc5xqGpWwxj1xpJBIZQLZFpnIM6AjDo';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Using demo values - DO NOT USE FOR PRODUCTION.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Create a single supabase client for the entire app
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
