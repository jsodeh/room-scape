
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { FurnitureItem } from '@/types/database';

interface ImportStatsProps {
  stats: { total: number; valid: number } | null;
  processedItems: Partial<FurnitureItem>[];
  isBatchImporting: boolean;
  onBatchImport: () => void;
}

const ImportStats = ({ 
  stats, 
  processedItems, 
  isBatchImporting, 
  onBatchImport 
}: ImportStatsProps) => {
  if (!stats) return null;

  return (
    <div className="text-sm space-y-2">
      <p>Processed {stats.total} items, found {stats.valid} valid items with images.</p>
      
      {processedItems.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={onBatchImport}
            disabled={isBatchImporting}
            variant="secondary"
            className="gap-2"
          >
            {isBatchImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import All {processedItems.length} Items
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportStats;
