
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, Plus, Image, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageGuidelinesInfo from '@/components/admin/ImageGuidelinesInfo';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Form state
  const [currentItem, setCurrentItem] = useState<Partial<FurnitureItem>>({
    name: '',
    category: '',
    description: '',
    image_url: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchFurnitureItems();
  }, [categoryFilter]);

  const fetchFurnitureItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('furniture_items').select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
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

  const openAddDialog = () => {
    setCurrentItem({
      name: '',
      category: '',
      description: '',
      image_url: '',
    });
    setImageFile(null);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FurnitureItem) => {
    setCurrentItem(item);
    setImageFile(null);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setUploadProgress(0);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      return currentItem.image_url || null;
    }

    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `furniture/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('room-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast.error(`Failed to upload image: ${error.message}`);
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
    
    try {
      // Upload image if changed
      const imageUrl = await uploadImage();
      
      // Prepare data for saving
      const itemData = {
        ...currentItem,
        image_url: imageUrl || currentItem.image_url,
      };
      
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

  return (
    <AdminLayout title="Furniture Management">
      <div className="space-y-6">
        <ImageGuidelinesInfo />
        
        <div className="flex justify-between items-center">
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
          </div>
          
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Add Furniture
          </Button>
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
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
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
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {FURNITURE_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                      </p>
                      {item.description && (
                        <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
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
            <DialogTitle>{isEditMode ? 'Edit Furniture Item' : 'Add New Furniture Item'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <Input
                id="name"
                name="name"
                value={currentItem.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium">Category</label>
              <Select
                value={currentItem.category}
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
            
            <div className="space-y-2">
              <label htmlFor="image" className="block text-sm font-medium">Image</label>
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {currentItem.image_url && (
                  <div className="h-10 w-10 rounded overflow-hidden border">
                    <img
                      src={currentItem.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
              {isUploading && (
                <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isEditMode ? 'Update' : 'Add'} Furniture
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFurniture;
