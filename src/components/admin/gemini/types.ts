
export interface AnalysisResult {
  success: boolean;
  analysis: string;
  structuredData?: any;
  error?: string;
}

export interface AnalysisTabProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
}

export interface ImageAnalysisTabProps extends AnalysisTabProps {
  onImageUrlsReady: (urls: string[]) => void;
}

export interface PdfAnalysisTabProps extends AnalysisTabProps {
  pdfUrl: string;
  onPdfUrlsReady: (urls: string[]) => void;
}

export interface CompareProductsTabProps extends AnalysisTabProps {
  onImageUrlsReady: (urls: string[]) => void;
}

export interface AnalysisProgressProps {
  progress: number;
}

export interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  resetAnalysis: () => void;
  extractFurnitureItem?: () => void;
}
