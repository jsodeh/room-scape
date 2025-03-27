
import { Button } from '@/components/ui/button';

interface HistorySelectorProps {
  historyViewMode: boolean;
  historyLength: number;
  currentHistoryIndex: number;
  onSelectHistoryIndex: (index: number) => void;
}

const HistorySelector = ({
  historyViewMode,
  historyLength,
  currentHistoryIndex,
  onSelectHistoryIndex
}: HistorySelectorProps) => {
  if (!historyViewMode || historyLength === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-muted rounded-lg">
      <h3 className="text-sm font-medium mb-2">Editing History</h3>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: historyLength }).map((_, idx) => (
          <Button
            key={idx}
            variant={currentHistoryIndex === idx ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectHistoryIndex(idx)}
          >
            Version {idx + 1}
          </Button>
        ))}
        <Button
          variant={currentHistoryIndex === -1 ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectHistoryIndex(-1)}
        >
          Current
        </Button>
      </div>
    </div>
  );
};

export default HistorySelector;
