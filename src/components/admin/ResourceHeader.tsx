
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ResourceHeaderProps {
  title: string;
  description: string;
  onAddNew: () => void;
}

const ResourceHeader = ({ title, description, onAddNew }: ResourceHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="max-w-md space-y-1">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAddNew} className="gap-2">
        <Plus className="h-4 w-4" /> Add Resource
      </Button>
    </div>
  );
};

export default ResourceHeader;
