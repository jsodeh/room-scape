
import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, FileText, Images } from 'lucide-react';

interface TabsContainerProps {
  activeTab: 'image' | 'pdf' | 'compare';
  onTabChange: (value: string) => void;
  children: ReactNode;
}

const TabsContainer = ({ activeTab, onTabChange, children }: TabsContainerProps) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'image' | 'pdf' | 'compare')}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="image" className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          <span>Image Analysis</span>
        </TabsTrigger>
        <TabsTrigger value="pdf" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>PDF Analysis</span>
        </TabsTrigger>
        <TabsTrigger value="compare" className="flex items-center gap-2">
          <Images className="h-4 w-4" />
          <span>Compare Products</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};

export default TabsContainer;
