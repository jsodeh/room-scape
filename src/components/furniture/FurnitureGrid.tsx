
import { Skeleton } from '@/components/ui/skeleton';
import { FurnitureItem as FurnitureItemType } from '@/lib/supabase';
import FurnitureItem from './FurnitureItem';

interface FurnitureGridProps {
  items: FurnitureItemType[];
  selectedItems: FurnitureItemType[];
  loading: boolean;
  onItemClick: (item: FurnitureItemType) => void;
  category: string;
}

const FurnitureGrid = ({ items, selectedItems, loading, onItemClick, category }: FurnitureGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-muted-foreground animate-fade-in">
        {category === 'custom' ? (
          <p>You haven't uploaded any custom furniture images yet.</p>
        ) : (
          <p>No furniture items found. Try adjusting your search or filters.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="animate-fade-in" 
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <FurnitureItem
            item={item}
            isSelected={selectedItems.some(selectedItem => selectedItem.id === item.id)}
            onClick={() => onItemClick(item)}
          />
        </div>
      ))}
    </div>
  );
};

export default FurnitureGrid;
