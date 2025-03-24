
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
      <div className="flex gap-2 animate-fade-in">
        {categories.map((category, index) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="rounded-full transition-all duration-300 transform"
            onClick={() => onCategoryChange(category.id)}
            style={{ 
              animationDelay: `${index * 50}ms`,
              transform: selectedCategory === category.id ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FurnitureCategoryBar;
