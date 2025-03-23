
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageGuidelinesInfo from '@/components/admin/ImageGuidelinesInfo';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/database';
import ResourceFilters from '@/components/admin/ResourceFilters';
import ResourceGridView from '@/components/admin/ResourceGridView';
import ResourceDialog from '@/components/admin/ResourceDialog';

// Using a type assertion to prevent excessive type inference depth
const initialItemState: Partial<FurnitureItem> = {
  name: '',
  category: '',
  description: '',
  image_url: '',
  resource_type: 'image' as const,
  external_url: '',
  pdf_url: '',
};

const AdminFurniture = () => {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  
  const [currentItem, setCurrentItem] = useState<Partial<FurnitureItem>>(initialItemState);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchFurnitureItems();
  }, [categoryFilter, resourceTypeFilter]);

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

  const openAddDialog = () => {
    setCurrentItem(initialItemState);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FurnitureItem) => {
    setCurrentItem(item);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const uploadFile = async (file: File, bucket: string = 'room-images', folder: string = 'furniture'): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
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
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
      console.error(error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem.name || !currentItem.category) {
      toast.error('Name and category are required');
      return;
    }

    if (currentItem.resource_type === 'url' && !currentItem.external_url) {
      toast.error('URL is required for web resources');
      return;
    }
    
    try {
      let itemData: FurnitureItem = {
        id: currentItem.id || '',
        name: currentItem.name,
        category: currentItem.category,
        description: currentItem.description || '',
        image_url: currentItem.image_url || '',
        resource_type: currentItem.resource_type,
        external_url: currentItem.external_url,
        pdf_url: currentItem.pdf_url,
      };
      
      if (isEditMode && currentItem.id) {
        const { error } = await supabase
          .from('furniture_items')
          .update(itemData)
          .eq('id', currentItem.id);
        
        if (error) throw error;
        toast.success('Furniture item updated successfully');
      } else {
        const { id, ...newItemData } = itemData;
        const { error } = await supabase
          .from('furniture_items')
          .insert(newItemData);
        
        if (error) throw error;
        toast.success('Furniture item added successfully');
      }
      
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
        
        <ResourceFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          resourceTypeFilter={resourceTypeFilter}
          setResourceTypeFilter={setResourceTypeFilter}
        />
        
        <ResourceGridView 
          furniture={filteredFurniture}
          isLoading={isLoading}
          onEdit={openEditDialog}
          onDelete={handleDelete}
        />
      </div>
      
      <ResourceDialog 
        isOpen={isDialogOpen}
        onClose={closeDialog}
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        isEditMode={isEditMode}
        onSave={handleSubmit}
      />
    </AdminLayout>
  );
};

export default AdminFurniture;
