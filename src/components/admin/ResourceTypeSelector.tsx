
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, FileText, Link as LinkIcon } from 'lucide-react';

interface ResourceTypeSelectorProps {
  value: string;
  onChange: (value: 'image' | 'pdf' | 'url') => void;
}

const ResourceTypeSelector = ({ value, onChange }: ResourceTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="resource_type" className="block text-sm font-medium">Resource Type</label>
      <Tabs 
        value={value} 
        onValueChange={(value) => onChange(value as 'image' | 'pdf' | 'url')}
      >
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="image" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span>Image</span>
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            <span>Web URL</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ResourceTypeSelector;
