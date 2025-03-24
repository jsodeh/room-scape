
import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Upload, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getFurnitureItems } from '@/services/storageService';
import { FurnitureItem } from '@/lib/supabase';
import ImageUpload from '@/components/image-upload/ImageUpload';
import CustomFurnitureUploader from './furniture/CustomFurnitureUploader';

// Categories remain static but furniture items will be fetched from Supabase
const FURNITURE_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'sofas', name: 'Sofas' },
  { id: 'tables', name: 'Tables' },
  { id: 'chairs', name: 'Chairs' },
  { id: 'beds', name: 'Beds' },
  { id: 'storage', name: 'Storage' },
  { id: 'decor', name: 'Decor' },
  { id: 'lighting', name: 'Lighting' },
  { id: 'custom', name: 'My Uploads' },
];

interface FurnitureSelectorProps {
  onFurnitureSelected: (items: FurnitureItem[]) => void;
}

const FurnitureSelector = ({ onFurnitureSelected }: FurnitureSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<FurnitureItem[]>([]);
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [customItems, setCustomItems] = useState<FurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    const loadFurnitureItems = async () => {
      setLoading(true);
      try {
        const items = await getFurnitureItems(selectedCategory !== 'custom' ? selectedCategory : 'all');
        setFurnitureItems(items);
      } catch (error) {
        console.error('Error loading furniture items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategory !== 'custom') {
      loadFurnitureItems();
    } else {
      setLoading(false);
    }
  }, [selectedCategory]);

  const filteredItems = (selectedCategory === 'custom' ? customItems : furnitureItems).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const toggleItemSelection = (item: FurnitureItem) => {
    const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
    
    if (isSelected) {
      const newSelectedItems = selectedItems.filter(selectedItem => selectedItem.id !== item.id);
      setSelectedItems(newSelectedItems);
      onFurnitureSelected(newSelectedItems);
    } else {
      const newSelectedItems = [...selectedItems, item];
      setSelectedItems(newSelectedItems);
      onFurnitureSelected(newSelectedItems);
    }
  };

  const handleCustomImageUploaded = (imageUrl: string) => {
    // Create a custom furniture item
    const newCustomItem: FurnitureItem = {
      id: `custom-${Date.now()}`,
      name: 'Custom Furniture',
      category: 'custom',
      description: 'Your uploaded furniture',
      image_url: imageUrl,
    };
    
    const updatedCustomItems = [...customItems, newCustomItem];
    setCustomItems(updatedCustomItems);
    
    // Auto-select the newly uploaded item
    const newSelectedItems = [...selectedItems, newCustomItem];
    setSelectedItems(newSelectedItems);
    onFurnitureSelected(newSelectedItems);
    
    // Close the uploader
    setShowUploader(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search furniture..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setShowUploader(true)}
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
        
        <ScrollArea className="whitespace-nowrap pb-2">
          <div className="flex gap-2">
            {FURNITURE_CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {showUploader && (
        <div className="border-2 border-dashed rounded-lg p-4">
          <CustomFurnitureUploader 
            onImageUploaded={handleCustomImageUploaded}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}
      
      {selectedCategory === 'custom' && !showUploader && (
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <div className="space-y-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Upload Your Furniture</h3>
            <p className="text-sm text-muted-foreground">
              Add your own furniture images to include in staging
              <span className="block text-xs mt-1 text-amber-600 font-medium">Premium Feature</span>
            </p>
            <Button onClick={() => setShowUploader(true)}>
              Upload Custom Furniture
            </Button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => {
              const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
              const isCustom = item.id.toString().startsWith('custom-');
              
              return (
                <div 
                  key={item.id}
                  className={`
                    rounded-lg overflow-hidden border border-gray-200 bg-card transition-all duration-200
                    ${isSelected ? 'ring-2 ring-primary' : 'hover:border-gray-300'}
                  `}
                  onClick={() => toggleItemSelection(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Badge>Selected</Badge>
                      </div>
                    )}
                    {isCustom && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                          Custom
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              {selectedCategory === 'custom' ? (
                <p>You haven't uploaded any custom furniture images yet.</p>
              ) : (
                <p>No furniture items found. Try adjusting your search or filters.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div>
            <span className="text-sm font-medium">{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedItems([]);
              onFurnitureSelected([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default FurnitureSelector;
