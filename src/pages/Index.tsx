
import { useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultsDisplay from '@/components/ResultsDisplay';
import StagingWizard from '@/components/staging-wizard/StagingWizard';
import { StagingProvider, useStagingContext } from '@/context/StagingContext';
import { useStagingProcessor } from '@/hooks/useStagingProcessor';
import { useAuth } from '@/context/AuthContext';

const StagingContent = () => {
  const { user } = useAuth();
  const { 
    uploadedImages,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    isProcessing,
    isComplete,
    originalImageUrls,
    stagedImageResults,
    currentProjectId,
    setCurrentProjectId,
    setStagedImageResults,
    setIsProcessing,
    setIsComplete,
    resetState
  } = useStagingContext();

  const { handleSubmit, handleRegenerate } = useStagingProcessor({
    userId: user?.id,
    originalImageUrls,
    selectedFurniture,
    stagingInstructions,
    referenceImageUrl,
    currentProjectId,
    setCurrentProjectId,
    setStagedImageResults,
    setIsProcessing,
    setIsComplete
  });

  if (isComplete) {
    return (
      <div className="max-w-5xl mx-auto pt-12">
        <h1 className="text-3xl font-semibold text-center mb-8">Your Staged Room</h1>
        <ResultsDisplay 
          originalImages={originalImageUrls}
          stagedImages={stagedImageResults}
          onRegenerate={handleRegenerate}
          onReset={resetState}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-12">
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl font-semibold">Virtual Room Staging</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Transform empty spaces into beautifully staged rooms in just a few steps.
          Upload photos, select furniture, and provide instructions to get started.
        </p>
      </div>
      
      <StagingWizard onSubmit={handleSubmit} />
    </div>
  );
};

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-16 px-4 container mx-auto">
        <StagingProvider>
          <StagingContent />
        </StagingProvider>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
