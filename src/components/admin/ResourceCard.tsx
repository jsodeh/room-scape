
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileText, Image, Link as LinkIcon } from 'lucide-react';
import { FurnitureItem } from '@/types/database';

// Furniture categories
const FURNITURE_CATEGORIES = [
  { id: 'sofas', name: 'Sofas' },
  { id: 'tables', name: 'Tables' },
  { id: 'chairs', name: 'Chairs' },
  { id: 'beds', name: 'Beds' },
  { id: 'storage', name: 'Storage' },
  { id: 'decor', name: 'Decor' },
  { id: 'lighting', name: 'Lighting' },
];

interface ResourceCardProps {
  item: FurnitureItem;
  onEdit: (item: FurnitureItem) => void;
  onDelete: (id: string) => void;
}

const ResourceCard = ({ item, onEdit, onDelete }: ResourceCardProps) => {
  const getResourceTypeIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getResourceTypeLabel = (type?: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'url':
        return 'Web URL';
      default:
        return 'Image';
    }
  };

  const renderResourcePreview = () => {
    if (item.resource_type === 'pdf') {
      return (
        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
          <FileText className="h-16 w-16 text-gray-400" />
          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded">
            PDF
          </div>
        </div>
      );
    } else if (item.resource_type === 'url') {
      return (
        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
          <LinkIcon className="h-16 w-16 text-gray-400" />
          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded">
            URL
          </div>
        </div>
      );
    } else {
      return (
        <div className="aspect-square relative overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
  };

  return (
    <Card key={item.id} className="overflow-hidden">
      {renderResourcePreview()}
      <div className="absolute top-2 right-2 flex gap-2">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="destructive" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 bg-secondary rounded-full flex items-center gap-1">
            {getResourceTypeIcon(item.resource_type)}
            {getResourceTypeLabel(item.resource_type)}
          </span>
        </div>
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground">
          {FURNITURE_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
        </p>
        {item.description && (
          <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
        )}
        {item.resource_type === 'url' && item.external_url && (
          <a 
            href={item.external_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 mt-2 flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            Visit Website
          </a>
        )}
        {item.resource_type === 'pdf' && item.pdf_url && (
          <a 
            href={item.pdf_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 mt-2 flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            View PDF
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
