
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImageGuidelinesInfo from '@/components/admin/ImageGuidelinesInfo';
import ResourceDialog from '@/components/admin/ResourceDialog';
import ResourceHeader from '@/components/admin/ResourceHeader';
import ResourceSearchAndFilter from '@/components/admin/ResourceSearchAndFilter';
import ResourceContent from '@/components/admin/ResourceContent';
import { useFurnitureItems } from '@/hooks/useFurnitureItems';
import { useFurnitureItemManagement } from '@/hooks/useFurnitureItemManagement';

const AdminFurniture = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  
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

  return (
    <AdminLayout title="Furniture Management">
      <div className="space-y-6">
        <ResourceHeader 
          title="Furniture Resource Database"
          description="Manage furniture resources that can be used by the AI model for staging rooms."
          onAddNew={openAddDialog}
        />
        
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
