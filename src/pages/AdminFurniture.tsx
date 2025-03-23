
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pencil, Trash2, Plus, Image, Search, 
  FileText, Link as LinkIcon 
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageGuidelinesInfo from '@/components/admin/ImageGuidelinesInfo';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/ImageUpload';
import { FurnitureItem } from '@/types/database';

// Furniture categories
const FURNITURE_CATEGORIES = [
  { id: 'sofas', name: 'Sofas' },
  { id: 'tables', name: 'Tables' },
  { id: 'chairs', name: 'Chairs' },
  { id: 'beds', name: 'Beds' },
  { id: 'storage', name: 'Storage' },
  { id: 'decor', name: 'Decor' },
  { id: 'lighting', name: 'Lighting' },
];

const AdminFurniture = () => {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  
  // Form state
  const [currentItem, setCurrentItem] = useState<Partial<FurnitureItem>>({
    name: '',
    category: '',
    description: '',
    image_url: '',
    resource_type: 'image',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resourceTab, setResourceTab] = useState<'image' | 'pdf' | 'url'>('image');

  useEffect(() => {
    fetchFurnitureItems();
  }, [categoryFilter, resourceTypeFilter]);

  useEffect(() => {
    if (isDialogOpen) {
      // Set the resource tab based on the current item's resource type
      if (currentItem.resource_type) {
        setResourceTab(currentItem.resource_type);
      }
    }
  }, [isDialogOpen, currentItem]);

  const fetchFurnitureItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('furniture_items').select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (resourceTypeFilter !== 'all') {
        query = query.eq('resource_type', resourceTypeFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFurniture(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch furniture items: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleImagesSelected = (files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
    }
  };

  const handleImageUrlsReady = (urls: string[]) => {
    if (urls.length > 0) {
      setCurrentItem(prev => ({ ...prev, image_url: urls[0] }));
    }
  };

  const openAddDialog = () => {
    setCurrentItem({
      name: '',
      category: '',
      description: '',
      image_url: '',
      resource_type: 'image',
      external_url: '',
      pdf_url: '',
    });
    setImageFile(null);
    setPdfFile(null);
    setIsEditMode(false);
    setResourceTab('image');
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FurnitureItem) => {
    setCurrentItem(item);
    setImageFile(null);
    setPdfFile(null);
    setIsEditMode(true);
    setResourceTab(item.resource_type || 'image');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setUploadProgress(0);
  };

  const uploadFile = async (file: File, bucket: string = 'room-images', folder: string = 'furniture'): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
      console.error(error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem.name || !currentItem.category) {
      toast.error('Name and category are required');
      return;
    }

    // Validate based on resource type
    if (currentItem.resource_type === 'url' && !currentItem.external_url) {
      toast.error('URL is required for web resources');
      return;
    }
    
    try {
      let itemData: Partial<FurnitureItem> = { ...currentItem };
      
      // Process based on resource type
      if (currentItem.resource_type === 'image') {
        // Upload image if changed
        if (imageFile) {
          const imageUrl = await uploadFile(imageFile);
          if (imageUrl) {
            itemData.image_url = imageUrl;
          }
        }
        
        // Ensure we have an image URL
        if (!itemData.image_url) {
          toast.error('Image URL is required');
          return;
        }
      } 
      else if (currentItem.resource_type === 'pdf') {
        // Upload PDF if changed
        if (pdfFile) {
          const pdfUrl = await uploadFile(pdfFile, 'room-images', 'pdfs');
          if (pdfUrl) {
            itemData.pdf_url = pdfUrl;
          }
        }
        
        // Ensure we have a PDF URL
        if (!itemData.pdf_url) {
          toast.error('PDF file is required');
          return;
        }
        
        // Add a placeholder image if none exists
        if (!itemData.image_url) {
          itemData.image_url = '/placeholder.svg';
        }
      }
      
      // Ensure these fields exist and are required
      itemData.name = currentItem.name;
      itemData.category = currentItem.category;
      
      if (isEditMode && currentItem.id) {
        // Update existing item
        const { error } = await supabase
          .from('furniture_items')
          .update(itemData)
          .eq('id', currentItem.id);
        
        if (error) throw error;
        toast.success('Furniture item updated successfully');
      } else {
        // Create new item
        const { error } = await supabase
          .from('furniture_items')
          .insert(itemData);
        
        if (error) throw error;
        toast.success('Furniture item added successfully');
      }
      
      // Refresh the list
      fetchFurnitureItems();
      closeDialog();
    } catch (error: any) {
      toast.error(`Failed to save furniture item: ${error.message}`);
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('furniture_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Furniture item deleted successfully');
      fetchFurnitureItems();
    } catch (error: any) {
      toast.error(`Failed to delete furniture item: ${error.message}`);
      console.error(error);
    }
  };

  const filteredFurniture = furniture.filter(item => {
    if (searchQuery === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query) || false)
    );
  });

  const getResourceTypeIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getResourceTypeLabel = (type?: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'url':
        return 'Web URL';
      default:
        return 'Image';
    }
  };

  const renderResourcePreview = (item: FurnitureItem) => {
    if (item.resource_type === 'pdf') {
      return (
        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
          <FileText className="h-16 w-16 text-gray-400" />
          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded">
            PDF
          </div>
        </div>
      );
    } else if (item.resource_type === 'url') {
      return (
        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
          <LinkIcon className="h-16 w-16 text-gray-400" />
          <div className="absolute bottom-2 right-2 bg-primary text-white text-xs py-1 px-2 rounded">
            URL
          </div>
        </div>
      );
    } else {
      return (
        <div className="aspect-square relative overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
  };

  return (
    <AdminLayout title="Furniture Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="max-w-md space-y-1">
            <h2 className="text-lg font-medium">Furniture Resource Database</h2>
            <p className="text-sm text-muted-foreground">
              Manage furniture resources that can be used by the AI model for staging rooms.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Add Resource
          </Button>
        </div>
        
        <ImageGuidelinesInfo />
        
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-3 flex-1 max-w-md items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search furniture..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FURNITURE_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={resourceTypeFilter}
              onValueChange={(value) => setResourceTypeFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="url">Web URLs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-square bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredFurniture.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No furniture items found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFurniture.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    {renderResourcePreview(item)}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded-full flex items-center gap-1">
                          {getResourceTypeIcon(item.resource_type)}
                          {getResourceTypeLabel(item.resource_type)}
                        </span>
                      </div>
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {FURNITURE_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                      </p>
                      {item.description && (
                        <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
                      )}
                      {item.resource_type === 'url' && item.external_url && (
                        <a 
                          href={item.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:text-blue-700 mt-2 flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Visit Website
                        </a>
                      )}
                      {item.resource_type === 'pdf' && item.pdf_url && (
                        <a 
                          href={item.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:text-blue-700 mt-2 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View PDF
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="resource_type" className="block text-sm font-medium">Resource Type</label>
              <Tabs value={resourceTab} onValueChange={(value) => {
                setResourceTab(value as 'image' | 'pdf' | 'url');
                setCurrentItem(prev => ({...prev, resource_type: value as 'image' | 'pdf' | 'url'}));
              }}>
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="image" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>PDF</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <span>Web URL</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <Input
                id="name"
                name="name"
                value={currentItem.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium">Category</label>
              <Select
                value={currentItem.category || ''}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FURNITURE_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">Description</label>
              <Textarea
                id="description"
                name="description"
                value={currentItem.description || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <TabsContent value="image" className="mt-0 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Upload Image</label>
                <ImageUpload
                  onImagesSelected={handleImagesSelected}
                  onImageUrlsReady={handleImageUrlsReady}
                  maxFiles={1}
                />
                {currentItem.image_url && !imageFile && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Current Image:</p>
                    <div className="h-28 w-28 rounded overflow-hidden border">
                      <img
                        src={currentItem.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pdf" className="mt-0 space-y-4">
              <div className="space-y-2">
                <label htmlFor="pdf" className="block text-sm font-medium">Upload PDF Document</label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                />
                {currentItem.pdf_url && !pdfFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <a 
                      href={currentItem.pdf_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View current PDF
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-0 space-y-4">
              <div className="space-y-2">
                <label htmlFor="external_url" className="block text-sm font-medium">Website URL</label>
                <Input
                  id="external_url"
                  name="external_url"
                  type="url"
                  placeholder="https://example.com/furniture-item"
                  value={currentItem.external_url || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="thumbnail" className="block text-sm font-medium">Thumbnail Image (Optional)</label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {currentItem.image_url && !imageFile && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Current Thumbnail:</p>
                    <div className="h-28 w-28 rounded overflow-hidden border">
                      <img
                        src={currentItem.image_url}
                        alt="Thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {isUploading && (
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isEditMode ? 'Update' : 'Add'} Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFurniture;

