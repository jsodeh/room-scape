
// Define types for our database tables
export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  created_at?: string;
}

export interface StagingProject {
  id: string;
  user_id: string;
  title?: string;
  instructions: string;
  furniture_ids: string[];
  original_images: string[];
  staged_images: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}
