
import { useState, useEffect } from 'react';
import { getFurnitureItems } from '@/services/storageService';
import { FurnitureItem } from '@/lib/supabase';
import FurnitureSearchBar from './furniture/FurnitureSearchBar';
import FurnitureCategoryBar from './furniture/FurnitureCategoryBar';
import FurnitureGrid from './furniture/FurnitureGrid';
import CustomUploadPrompt from './furniture/CustomUploadPrompt';
import SelectedItemsBar from './furniture/SelectedItemsBar';
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

  const handleClearAllSelected = () => {
    setSelectedItems([]);
    onFurnitureSelected([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <FurnitureSearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUploadClick={() => setShowUploader(true)}
        />
        
        <FurnitureCategoryBar 
          categories={FURNITURE_CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
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
        <CustomUploadPrompt onUploadClick={() => setShowUploader(true)} />
      )}
      
      <FurnitureGrid 
        items={filteredItems}
        selectedItems={selectedItems}
        loading={loading}
        onItemClick={toggleItemSelection}
        category={selectedCategory}
      />
      
      <SelectedItemsBar 
        itemCount={selectedItems.length}
        onClearAll={handleClearAllSelected}
      />
    </div>
  );
};

export default FurnitureSelector;
