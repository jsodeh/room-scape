
import React from 'react';
import { Input } from '@/components/ui/input';

interface UrlResourceFormProps {
  externalUrl: string | undefined;
  imageUrl: string | undefined;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UrlResourceForm = ({ 
  externalUrl, 
  imageUrl, 
  onInputChange, 
  onImageChange 
}: UrlResourceFormProps) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="external_url" className="block text-sm font-medium">Website URL</label>
        <Input
          id="external_url"
          name="external_url"
          type="url"
          placeholder="https://example.com/furniture-item"
          value={externalUrl || ''}
          onChange={onInputChange}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="thumbnail" className="block text-sm font-medium">Thumbnail Image (Optional)</label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={onImageChange}
        />
        {imageUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Current Thumbnail:</p>
            <div className="h-28 w-28 rounded overflow-hidden border">
              <img
                src={imageUrl}
                alt="Thumbnail"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UrlResourceForm;
