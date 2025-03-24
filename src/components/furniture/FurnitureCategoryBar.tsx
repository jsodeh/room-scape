
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FurnitureCategoryBarProps {
  categories: { id: string; name: string }[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const FurnitureCategoryBar = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: FurnitureCategoryBarProps) => {
  return (
    <ScrollArea className="whitespace-nowrap pb-2">
      <div className="flex gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FurnitureCategoryBar;
