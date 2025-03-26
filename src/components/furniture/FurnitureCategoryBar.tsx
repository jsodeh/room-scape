
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useFurnitureCategories } from '@/hooks/useFurnitureCategories';

interface FurnitureCategoryBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: { id: string; name: string }[]; // Make this optional
}

const FurnitureCategoryBar = ({ 
  selectedCategory, 
  onCategoryChange,
  categories: predefinedCategories
}: FurnitureCategoryBarProps) => {
  const { categories: databaseCategories, isLoading, refreshCategories } = useFurnitureCategories();
  
  // Use predefined categories if provided, otherwise use the ones fetched from the database
  const categories = predefinedCategories || databaseCategories;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Categories</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshCategories} 
          className="h-8 px-2"
          title="Refresh categories from database"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="relative">
        <ScrollArea className="w-full max-w-full">
          <div className="flex gap-2 pb-2 pr-4" style={{ minWidth: 'max-content' }}>
            {isLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-20 rounded-full flex-shrink-0" />
                ))}
              </>
            ) : (
              <>
                {categories.map((category, index) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="rounded-full transition-all duration-300 transform flex-shrink-0"
                    onClick={() => onCategoryChange(category.id)}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      transform: selectedCategory === category.id ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {category.name}
                    {"count" in category && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {(category as any).count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default FurnitureCategoryBar;
