
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { webScraperService } from '@/services/webScraperService';
import { toast } from 'sonner';
import { FurnitureItem } from '@/types/database';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WebScraperProps {
  onItemsExtracted: (items: Partial<FurnitureItem>[]) => void;
}

const WebScraper: React.FC<WebScraperProps> = ({ onItemsExtracted }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedItems, setExtractedItems] = useState<Partial<FurnitureItem>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('url');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setExtractedItems([]);
    setSelectedItems(new Set());
    setError(null);

    try {
      // Start crawling
      console.log('Starting web scraping for URL:', url);
      setProgress(30);
      const result = await webScraperService.crawlWebsite({ url });
      
      // Check if the operation was successful
      if (!result.success) {
        throw new Error(result.error || 'Failed to crawl website');
      }
      
      setProgress(70);

      // Extract items from the crawl result
      const items = webScraperService.extractFurnitureItems(result);
      
      // Convert to FurnitureItem format
      const furnitureItems = items.map(item => ({
        name: item.name,
        description: item.description,
        category: item.category,
        image_url: item.imageUrl,
        resource_type: 'image' as 'image' | 'pdf' | 'url',
      }));
      
      setExtractedItems(furnitureItems);
      
      if (furnitureItems.length > 0) {
        toast.success(`Found ${furnitureItems.length} potential furniture items`);
        setActiveTab('items');
      } else {
        toast.warning('No furniture items found. Try a different URL or check if the website contains furniture images.');
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      setError(error.message || 'Failed to extract data from website');
      toast.error(error.message || 'Failed to extract data from website');
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleUseSelected = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item');
      return;
    }

    const selected = Array.from(selectedItems).map(index => extractedItems[index]);
    onItemsExtracted(selected);
    toast.success(`${selected.length} items added to your resources`);
    
    // Reset after using
    setSelectedItems(new Set());
    setActiveTab('url');
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Web Scraper</CardTitle>
        <CardDescription>
          Extract furniture information and images from websites
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">Enter URL</TabsTrigger>
          <TabsTrigger value="items" disabled={extractedItems.length === 0}>
            Found Items ({extractedItems.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="url">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://furniture-site.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of a furniture website to extract product information
                </p>
              </div>
              
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Crawling website...</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" disabled={isLoading || !url} className="w-full">
                {isLoading ? 'Extracting...' : 'Extract Furniture'}
              </Button>
            </form>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="items">
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Found {extractedItems.length} items</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
              </div>
              
              <div className="h-[300px] overflow-y-auto border rounded-md p-2">
                {extractedItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {extractedItems.map((item, index) => (
                      <div key={index} className="relative border rounded-md p-2">
                        <div className="absolute top-2 right-2 z-10">
                          <Checkbox
                            checked={selectedItems.has(index)}
                            onCheckedChange={() => toggleItemSelection(index)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="h-24 w-full overflow-hidden rounded-md">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          
                          <div className="text-sm font-medium line-clamp-1">{item.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                          <div className="text-xs px-2 py-1 bg-secondary inline-block rounded-full">
                            {item.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No items found</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('url')}>
              Back
            </Button>
            <Button 
              onClick={handleUseSelected}
              disabled={selectedItems.size === 0}
            >
              Use Selected ({selectedItems.size})
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default WebScraper;
