
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { FURNITURE_CATEGORIES } from './ResourceFilters';
import { FurnitureItem } from '@/types/database';

interface ResourceBasicFieldsProps {
  currentItem: Partial<FurnitureItem>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const ResourceBasicFields = ({ 
  currentItem, 
  onInputChange, 
  onSelectChange 
}: ResourceBasicFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <Input
          id="name"
          name="name"
          value={currentItem.name || ''}
          onChange={onInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="category" className="block text-sm font-medium">Category</label>
        <Select
          value={currentItem.category || ''}
          onValueChange={(value) => onSelectChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {FURNITURE_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <Textarea
          id="description"
          name="description"
          value={currentItem.description || ''}
          onChange={onInputChange}
          rows={3}
        />
      </div>
    </>
  );
};

export default ResourceBasicFields;
