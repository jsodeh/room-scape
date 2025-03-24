
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AnalysisProgressProps } from './types';

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm">Analyzing with Gemini AI...</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default AnalysisProgress;
