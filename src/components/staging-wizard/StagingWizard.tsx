
import { useState } from 'react';
import { TabsWrapper, TabsContent, TabsList, TabsTrigger } from '@/components/TabsWrapper';
import { Upload, Sofa, MessageSquare } from 'lucide-react';
import UploadStep from './UploadStep';
import FurnitureStep from './FurnitureStep';
import InstructionsStep from './InstructionsStep';
import { useStagingContext } from '@/context/StagingContext';

interface StagingWizardProps {
  onSubmit: () => void;
}

const StagingWizard = ({ onSubmit }: StagingWizardProps) => {
  const [activeTab, setActiveTab] = useState('upload');
  const { 
    uploadedImages, 
    originalImageUrls, 
    selectedFurniture, 
    stagingInstructions,
    isProcessing
  } = useStagingContext();

  const isStepComplete = (step: string) => {
    switch (step) {
      case 'upload':
        return uploadedImages.length > 0 && originalImageUrls.length > 0;
      case 'furniture':
        return selectedFurniture.length > 0;
      case 'instructions':
        return stagingInstructions.trim().length > 0;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (activeTab === 'upload' && isStepComplete('upload')) {
      setActiveTab('furniture');
    } else if (activeTab === 'furniture' && isStepComplete('furniture')) {
      setActiveTab('instructions');
    }
  };

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
          value="furniture" 
          className="data-[state=active]:shadow-sm relative"
          disabled={!isStepComplete('upload')}
        >
          <span className="flex items-center gap-2">
            <Sofa className="h-4 w-4" />
            <span className="hidden sm:inline">Select Furniture</span>
            <span className="sm:hidden">Furniture</span>
          </span>
          {isStepComplete('furniture') && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="instructions" 
          className="data-[state=active]:shadow-sm relative"
          disabled={!isStepComplete('furniture')}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Add Instructions</span>
            <span className="sm:hidden">Instructions</span>
          </span>
          {isStepComplete('instructions') && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
          )}
        </TabsTrigger>
      </TabsList>
      
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <TabsContent value="upload" className="mt-0">
          <UploadStep goToNextStep={goToNextStep} />
        </TabsContent>
        
        <TabsContent value="furniture" className="mt-0">
          <FurnitureStep goToNextStep={goToNextStep} />
        </TabsContent>
        
        <TabsContent value="instructions" className="mt-0">
          <InstructionsStep onSubmit={onSubmit} isProcessing={isProcessing} />
        </TabsContent>
      </div>
    </TabsWrapper>
  );
};

export default StagingWizard;
