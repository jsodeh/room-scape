
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface SelectedItemsBarProps {
  itemCount: number;
  onClearAll: () => void;
}

const SelectedItemsBar = ({ itemCount, onClearAll }: SelectedItemsBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(itemCount > 0);
  }, [itemCount]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className={`
      flex items-center justify-between p-4 bg-secondary rounded-lg 
      transition-all duration-300 transform
      ${itemCount > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      animate-slide-up
    `}>
      <div>
        <span className="text-sm font-medium">
          {itemCount} item{itemCount === 1 ? '' : 's'} selected
        </span>
      </div>
      <Button
        variant="ghost"
        onClick={onClearAll}
        className="transition-colors duration-300 hover:bg-secondary-foreground/10"
      >
        Clear all
      </Button>
    </div>
  );
};

export default SelectedItemsBar;
