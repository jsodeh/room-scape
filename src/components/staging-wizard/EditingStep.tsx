
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PencilIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useStagingContext } from '@/context/StagingContext';
import { toast } from 'sonner';

const EditingStep = () => {
  const { 
    originalImageUrls, 
    stagedImageResults, 
    isProcessing,
    handleEdit,
    resetState
  } = useStagingContext();

  const [editInstructions, setEditInstructions] = useState('');

  const handleSubmitEdit = () => {
    if (!editInstructions.trim()) {
      toast.error('Please provide editing instructions');
      return;
    }
    
    handleEdit(editInstructions);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium">Re-generating your staged room...</p>
        <p className="text-sm text-muted-foreground">This may take a few minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Edit Staging Instructions</h2>
        <p className="text-sm text-muted-foreground">
          Provide additional instructions to refine how your room should be staged.
        </p>
      </div>
      
      <div className="rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-2">Current Staged Room</h3>
            <div className="aspect-[4/3] rounded-md overflow-hidden border">
              <img 
                src={stagedImageResults[0]} 
                alt="Current staged room" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-medium mb-2">Original Room</h3>
            <div className="aspect-[4/3] rounded-md overflow-hidden border">
              <img 
                src={originalImageUrls[0]} 
                alt="Original room" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-base font-medium mb-2">Additional Instructions</h3>
            <Textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder="Example: Change the wall color to blue, use more minimalist furniture, add a plant in the corner..."
              className="min-h-[120px]"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetState}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={isProcessing || !editInstructions.trim()}
              className="gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Update Staging
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditingStep;
