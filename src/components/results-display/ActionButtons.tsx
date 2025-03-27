
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Pencil, History } from 'lucide-react';

interface ActionButtonsProps {
  onReset: () => void;
  onEdit?: () => void;
  isEditMode?: boolean;
  onOpenFullscreen: () => void;
  onDownload: () => void;
  hasHistory: boolean;
  historyViewMode: boolean;
  onToggleHistoryView: () => void;
}

const ActionButtons = ({
  onReset,
  onEdit,
  isEditMode,
  onOpenFullscreen,
  onDownload,
  hasHistory,
  historyViewMode,
  onToggleHistoryView
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset}>
          Start Over
        </Button>
        
        {hasHistory && (
          <Button 
            variant={historyViewMode ? "default" : "outline"} 
            className="gap-2" 
            onClick={onToggleHistoryView}
          >
            <History className="h-4 w-4" />
            {historyViewMode ? "Current Result" : "View History"}
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        {onEdit && !isEditMode && (
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        <Button variant="outline" className="gap-2" onClick={onOpenFullscreen}>
          <Maximize2 className="h-4 w-4" />
          Fullscreen
        </Button>
        <Button className="gap-2" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
