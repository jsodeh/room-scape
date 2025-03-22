
import { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock furniture data
const FURNITURE_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'sofas', name: 'Sofas' },
  { id: 'tables', name: 'Tables' },
  { id: 'chairs', name: 'Chairs' },
  { id: 'beds', name: 'Beds' },
  { id: 'storage', name: 'Storage' },
  { id: 'decor', name: 'Decor' },
  { id: 'lighting', name: 'Lighting' },
];

const FURNITURE_ITEMS = [
  {
    id: 1,
    name: 'Modern Sofa',
    category: 'sofas',
    description: 'Comfortable modern sofa with clean lines',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: 2,
    name: 'Wooden Coffee Table',
    category: 'tables',
    description: 'Rustic wooden coffee table',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a58d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80',
  },
  {
    id: 3,
    name: 'Dining Chair',
    category: 'chairs',
    description: 'Contemporary dining chair',
    image: 'https://images.unsplash.com/photo-1586158291800-2665f07bba79?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
  },
  {
    id: 4,
    name: 'Queen Bed',
    category: 'beds',
    description: 'Queen size bed with wooden frame',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: 5,
    name: 'Bookshelf',
    category: 'storage',
    description: 'Tall bookshelf with five shelves',
    image: 'https://images.unsplash.com/photo-1588168649846-da652bc5e165?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80',
  },
  {
    id: 6,
    name: 'Wall Art',
    category: 'decor',
    description: 'Abstract wall art for modern homes',
    image: 'https://images.unsplash.com/photo-1551732998-9573f695fdbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: 7,
    name: 'Floor Lamp',
    category: 'lighting',
    description: 'Adjustable contemporary floor lamp',
    image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
  },
  {
    id: 8,
    name: 'Side Table',
    category: 'tables',
    description: 'Minimalist side table',
    image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
  },
];

interface FurnitureSelectorProps {
  onFurnitureSelected: (items: typeof FURNITURE_ITEMS) => void;
}

const FurnitureSelector = ({ onFurnitureSelected }: FurnitureSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<typeof FURNITURE_ITEMS>([]);

  const filteredItems = FURNITURE_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItemSelection = (item: (typeof FURNITURE_ITEMS)[0]) => {
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const isSelected = selectedItems.some(selectedItem => selectedItem.id === item.id);
          
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
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Badge>Selected</Badge>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm">{item.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      
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
