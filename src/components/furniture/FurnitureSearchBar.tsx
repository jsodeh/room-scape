
import { Search, Filter, ChevronDown, Upload, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FurnitureSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUploadClick: () => void;
}

const FurnitureSearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  onUploadClick 
}: FurnitureSearchBarProps) => {
  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search furniture..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Button 
        onClick={onUploadClick}
        className="gap-1 bg-primary hover:bg-primary/90"
      >
        <Upload className="h-4 w-4" />
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Upload</span>
        <Badge variant="outline" className="ml-1 bg-amber-50 text-amber-600 border-amber-200 hidden sm:inline-flex">
          Premium
        </Badge>
      </Button>
      <Button variant="outline" className="gap-2">
        <Filter className="h-4 w-4" />
        Filter
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FurnitureSearchBar;
