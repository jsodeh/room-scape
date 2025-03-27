
import { useState, useEffect } from 'react';
import { TabsWrapper, TabsContent, TabsList, TabsTrigger } from '@/components/TabsWrapper';
import { Upload, MessageSquare, Image, Edit } from 'lucide-react';
import UploadStep from './UploadStep';
import InstructionsStep from './InstructionsStep';
import ResultsStep from './ResultsStep';
import { useStagingContext } from '@/context/StagingContext';

interface StagingWizardProps {
  onSubmit: () => void;
}

const StagingWizard = ({ onSubmit }: StagingWizardProps) => {
  const [activeTab, setActiveTab] = useState('upload');
  const { 
    uploadedImages, 
    originalImageUrls, 
    stagingInstructions,
    isProcessing,
    isComplete,
    isEditMode,
    stagedImageResults
  } = useStagingContext();

  const isStepComplete = (step: string) => {
    switch (step) {
      case 'upload':
        return uploadedImages.length > 0 && originalImageUrls.length > 0;
      case 'instructions':
        // Instructions are optional
        return true;
      case 'results':
        return isComplete && stagedImageResults.length > 0;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (activeTab === 'upload' && isStepComplete('upload')) {
      setActiveTab('instructions');
    } else if (activeTab === 'instructions') {
      setActiveTab('results');
    }
  };

  // Auto-navigate to results when processing completes
  useEffect(() => {
    if (isComplete && activeTab !== 'results') {
      setActiveTab('results');
    }
  }, [isComplete, activeTab]);

  return (
    <TabsWrapper value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-8">
        <TabsTrigger 
          value="upload" 
          className="data-[state=active]:shadow-sm relative"
        >
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Images</span>
            <span className="sm:hidden">Upload</span>
          </span>
          {isStepComplete('upload') && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="instructions" 
          className="data-[state=active]:shadow-sm relative"
          disabled={!isStepComplete('upload')}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Add Instructions</span>
            <span className="sm:hidden">Instructions</span>
          </span>
          {stagingInstructions.trim().length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="results" 
          className="data-[state=active]:shadow-sm relative"
          disabled={!isStepComplete('upload') || (isProcessing && !isComplete)}
        >
          <span className="flex items-center gap-2">
            {isEditMode ? (
              <Edit className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isEditMode ? "Edit Results" : "View Results"}
            </span>
            <span className="sm:hidden">
              {isEditMode ? "Edit" : "Results"}
            </span>
          </span>
          {isStepComplete('results') && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
          )}
        </TabsTrigger>
      </TabsList>
      
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <TabsContent value="upload" className="mt-0">
          <UploadStep goToNextStep={goToNextStep} />
        </TabsContent>
        
        <TabsContent value="instructions" className="mt-0">
          <InstructionsStep onSubmit={onSubmit} isProcessing={isProcessing} />
        </TabsContent>
        
        <TabsContent value="results" className="mt-0">
          <ResultsStep />
        </TabsContent>
      </div>
    </TabsWrapper>
  );
};

export default StagingWizard;
