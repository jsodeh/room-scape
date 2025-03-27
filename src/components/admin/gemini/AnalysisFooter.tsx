
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

interface AnalysisFooterProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const AnalysisFooter = ({ onAnalyze, isAnalyzing }: AnalysisFooterProps) => {
  return (
    <CardFooter className="pt-4">
      <Button 
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini AI'}
      </Button>
    </CardFooter>
  );
};

export default AnalysisFooter;
