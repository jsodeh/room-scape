
import React from 'react';
import ResourceFilters from './ResourceFilters';

interface ResourceSearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  resourceTypeFilter: string;
  setResourceTypeFilter: (value: string) => void;
}

const ResourceSearchAndFilter = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  resourceTypeFilter,
  setResourceTypeFilter
}: ResourceSearchAndFilterProps) => {
  return (
    <ResourceFilters
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      categoryFilter={categoryFilter}
      setCategoryFilter={setCategoryFilter}
      resourceTypeFilter={resourceTypeFilter}
      setResourceTypeFilter={setResourceTypeFilter}
    />
  );
};

export default ResourceSearchAndFilter;
