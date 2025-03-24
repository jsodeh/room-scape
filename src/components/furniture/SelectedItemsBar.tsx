
import { Button } from '@/components/ui/button';

interface SelectedItemsBarProps {
  itemCount: number;
  onClearAll: () => void;
}

const SelectedItemsBar = ({ itemCount, onClearAll }: SelectedItemsBarProps) => {
  if (itemCount === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
      <div>
        <span className="text-sm font-medium">{itemCount} item{itemCount === 1 ? '' : 's'} selected</span>
      </div>
      <Button
        variant="ghost"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
};

export default SelectedItemsBar;
