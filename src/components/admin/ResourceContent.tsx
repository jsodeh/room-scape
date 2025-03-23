
import React from 'react';
import { FurnitureItem } from '@/types/database';
import ResourceGridView from './ResourceGridView';

interface ResourceContentProps {
  furniture: FurnitureItem[];
  isLoading: boolean;
  searchQuery: string;
  onEdit: (item: FurnitureItem) => void;
  onDelete: (id: string) => void;
}

const ResourceContent = ({
  furniture,
  isLoading,
  searchQuery,
  onEdit,
  onDelete
}: ResourceContentProps) => {
  // Filter furniture items based on search query
  const filteredFurniture = furniture.filter(item => {
    if (searchQuery === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query) || false)
    );
  });

  return (
    <ResourceGridView 
      furniture={filteredFurniture}
      isLoading={isLoading}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

export default ResourceContent;
