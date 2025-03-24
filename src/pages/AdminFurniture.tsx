
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageGuidelinesInfo from '@/components/admin/ImageGuidelinesInfo';
import ResourceDialog from '@/components/admin/ResourceDialog';
import ResourceHeader from '@/components/admin/ResourceHeader';
import ResourceSearchAndFilter from '@/components/admin/ResourceSearchAndFilter';
import ResourceContent from '@/components/admin/ResourceContent';
import GeminiAnalyzer from '@/components/admin/gemini/GeminiAnalyzer';
import JsonImporter from '@/components/admin/json-importer/JsonImporter';
import { useFurnitureItems } from '@/hooks/useFurnitureItems';
import { useFurnitureItemManagement } from '@/hooks/useFurnitureItemManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FurnitureItem } from '@/types/database';

const AdminFurniture = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('manual');
  
  const { furniture, isLoading, fetchFurnitureItems } = useFurnitureItems(
    categoryFilter, 
    resourceTypeFilter
  );
  
  const {
    currentItem,
    setCurrentItem,
    isDialogOpen,
    isEditMode,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    handleDelete
  } = useFurnitureItemManagement(fetchFurnitureItems);

  const handleItemsExtracted = (items: Partial<FurnitureItem>[]) => {
    // Only open dialog if items are found and explicitly requested
    if (items.length > 0) {
      setCurrentItem(items[0]);
      openAddDialog();
    }
  };

  return (
    <AdminLayout title="Furniture Management">
      <div className="space-y-6">
        <ResourceHeader 
          title="Furniture Resource Database"
          description="Manage furniture resources that can be used by the AI model for staging rooms."
          onAddNew={openAddDialog}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="manual">Manual Management</TabsTrigger>
            <TabsTrigger value="json">JSON Import</TabsTrigger>
            <TabsTrigger value="gemini">Gemini AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-6">
            <ImageGuidelinesInfo />
            
            <ResourceSearchAndFilter 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              resourceTypeFilter={resourceTypeFilter}
              setResourceTypeFilter={setResourceTypeFilter}
            />
            
            <ResourceContent 
              furniture={furniture}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onEdit={openEditDialog}
              onDelete={handleDelete}
            />
          </TabsContent>
          
          <TabsContent value="json">
            <JsonImporter onItemsExtracted={handleItemsExtracted} />
          </TabsContent>
          
          <TabsContent value="gemini">
            <GeminiAnalyzer onItemsExtracted={handleItemsExtracted} />
          </TabsContent>
        </Tabs>
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
