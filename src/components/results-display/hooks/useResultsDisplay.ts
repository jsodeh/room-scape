
import { useState } from 'react';
import { toast } from 'sonner';

export interface ResultsDisplayState {
  currentIndex: number;
  showOriginal: boolean;
  historyViewMode: boolean;
  historyIndex: number;
}

export function useResultsDisplay(originalImages: string[], stagedImages: string[], stagedImageHistory: string[][]) {
  const [state, setState] = useState<ResultsDisplayState>({
    currentIndex: 0,
    showOriginal: false,
    historyViewMode: false,
    historyIndex: -1,
  });

  // Calculate the total history
  const hasHistory = stagedImageHistory.length > 1;
  const allHistory = [...stagedImageHistory.slice(0, -1), stagedImages]; // Add current images as last entry

  const navigateToNext = () => {
    if (state.currentIndex < stagedImages.length - 1) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  };

  const navigateToPrevious = () => {
    if (state.currentIndex > 0) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  };

  const handleDownload = () => {
    // Download current view (either from history or current result)
    const imageToDownload = state.historyViewMode && state.historyIndex >= 0
      ? allHistory[state.historyIndex][state.currentIndex] 
      : stagedImages[state.currentIndex];
      
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `staged-room-${state.historyViewMode ? `v${state.historyIndex+1}-` : ''}${state.currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded successfully');
  };

  const openFullscreen = () => {
    const imageToView = state.historyViewMode && state.historyIndex >= 0
      ? allHistory[state.historyIndex][state.currentIndex]
      : stagedImages[state.currentIndex];
    window.open(imageToView, '_blank');
  };

  const toggleHistoryView = () => {
    setState(prev => ({ 
      ...prev, 
      historyViewMode: !prev.historyViewMode,
      historyIndex: -1 // Reset to current result
    }));
  };

  const setHistoryIndex = (index: number) => {
    setState(prev => ({ ...prev, historyIndex: index }));
  };

  const toggleShowOriginal = () => {
    setState(prev => ({ ...prev, showOriginal: !prev.showOriginal }));
  };

  const setCurrentIndex = (index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }));
  };

  // Get the current image to display (from history or current results)
  const getCurrentImage = () => {
    if (state.historyViewMode && state.historyIndex >= 0 && state.historyIndex < allHistory.length) {
      return state.showOriginal ? originalImages[state.currentIndex] : allHistory[state.historyIndex][state.currentIndex];
    }
    return state.showOriginal ? originalImages[state.currentIndex] : stagedImages[state.currentIndex];
  };

  // Get the display label for the current view
  const getViewLabel = () => {
    if (state.showOriginal) return "Original";
    
    if (state.historyViewMode && state.historyIndex >= 0) {
      return `Version ${state.historyIndex + 1}`;
    }
    
    return "Staged";
  };

  // Get the image for a specific thumbnail index
  const getImageForThumbnail = (index: number) => {
    if (state.historyViewMode && state.historyIndex >= 0) {
      return allHistory[state.historyIndex][index];
    }
    return stagedImages[index];
  };

  return {
    state,
    hasHistory,
    allHistory,
    navigateToNext,
    navigateToPrevious,
    handleDownload,
    openFullscreen,
    toggleHistoryView,
    setHistoryIndex,
    toggleShowOriginal,
    setCurrentIndex,
    getCurrentImage,
    getViewLabel,
    getImageForThumbnail
  };
}
