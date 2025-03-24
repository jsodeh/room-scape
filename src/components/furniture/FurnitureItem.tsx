
import { Badge } from '@/components/ui/badge';
import { FurnitureItem as FurnitureItemType } from '@/lib/supabase';

interface FurnitureItemProps {
  item: FurnitureItemType;
  isSelected: boolean;
  onClick: () => void;
}

const FurnitureItem = ({ item, isSelected, onClick }: FurnitureItemProps) => {
  const isCustom = item.id.toString().startsWith('custom-');
  
  return (
    <div 
      className={`
        rounded-lg overflow-hidden border border-gray-200 bg-card transition-all duration-300 transform
        ${isSelected ? 'ring-2 ring-primary scale-[1.02]' : 'hover:border-gray-300 hover:scale-[1.01]'}
        animate-fade-in
      `}
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={item.image_url} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {isSelected && (
          <div className="absolute top-2 right-2 animate-scale-in">
            <Badge>Selected</Badge>
          </div>
        )}
        {isCustom && (
          <div className="absolute top-2 left-2 animate-fade-in">
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
};

export default FurnitureItem;
