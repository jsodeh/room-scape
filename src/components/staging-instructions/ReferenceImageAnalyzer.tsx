
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ReferenceImageAnalyzerProps {
  referenceImageUrl: string | null;
  onInstructionsGenerated: (instructions: string) => void;
}

const ReferenceImageAnalyzer = ({ 
  referenceImageUrl, 
  onInstructionsGenerated 
}: ReferenceImageAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestedInstructions, setSuggestedInstructions] = useState('');
  useEffect(() => { setAnalysis(null); setSuggestedInstructions(''); }, [referenceImageUrl]);

  const analyzeReferenceImage = async () => {
    if (!referenceImageUrl) {
      toast.error('Please upload a reference image first');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      console.log('Analyzing reference image:', referenceImageUrl);
      
      const { data, error } = await supabase.functions.invoke('gemini-analyzer', {
        body: {
          imageUrl: referenceImageUrl,
          mode: 'staging'
        }
      });
      
      if (error) {
        console.error('Error invoking gemini-analyzer:', error);
        throw new Error(error.message);
      }
      
      console.log('Analysis result:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze image');
      }
      
      setAnalysis(data.analysis);
      
      if (data.generatedInstructions) {
        setSuggestedInstructions(data.generatedInstructions);
        toast.success('Reference suggestions are ready to review.');
      }
    } catch (error) {
      console.error('Error analyzing reference image:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="flex items-center gap-2"
          onClick={analyzeReferenceImage}
          disabled={isAnalyzing || !referenceImageUrl}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              <span>Generate Instructions from Image</span>
            </>
          )}
        </Button>
        <div className="text-xs text-muted-foreground flex items-center">
          <Lightbulb className="h-3.5 w-3.5 mr-1" />
          <span>AI will analyze the design style</span>
        </div>
      </div>
      
      {analysis && (
        <div className="mt-4 p-3 border rounded-md bg-muted/50 text-xs">
          <p className="font-medium mb-1">Image Analysis</p>
          <p className="text-muted-foreground line-clamp-3">{analysis}</p>
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 h-auto text-xs"
            onClick={() => toast(
              'Image Analysis', 
              { description: analysis, duration: 10000 }
            )}
          >
            View Full Analysis
          </Button>
        </div>
      )}
      {suggestedInstructions && (
        <Button type="button" variant="outline" size="sm" onClick={() => {
          onInstructionsGenerated(suggestedInstructions);
          toast.success('Reference guidance applied separately from your notes.');
        }}>Apply reference guidance</Button>
      )}
    </div>
  );
};

export default ReferenceImageAnalyzer;
