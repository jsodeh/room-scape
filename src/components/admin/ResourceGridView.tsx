
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FurnitureItem } from '@/types/database';
import ResourceCard from './ResourceCard';

interface ResourceGridViewProps {
  furniture: FurnitureItem[];
  isLoading: boolean;
  onEdit: (item: FurnitureItem) => void;
  onDelete: (id: string) => void;
}

const ResourceGridView = ({ furniture, isLoading, onEdit, onDelete }: ResourceGridViewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="aspect-square bg-muted"></div>
            <CardContent className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (furniture.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No furniture items found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {furniture.map(item => (
        <ResourceCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ResourceGridView;
