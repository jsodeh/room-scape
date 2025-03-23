
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const ImageGuidelinesInfo = () => {
  return (
    <Alert className="my-6 bg-muted/50">
      <Info className="h-4 w-4" />
      <AlertTitle>Image Guidelines for Furniture Items</AlertTitle>
      <AlertDescription>
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="formats">
            <AccordionTrigger>Recommended Image Formats</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Formats:</strong> PNG or JPEG/JPG files work best</li>
                <li><strong>Resolution:</strong> 1024×1024 pixels is ideal for Stability AI</li>
                <li><strong>File size:</strong> Keep under 5MB for optimal performance</li>
                <li><strong>Transparency:</strong> PNG with transparent backgrounds works well</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="quality">
            <AccordionTrigger>Image Quality Guidelines</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Type:</strong> 2D product images work best (3D renders may work but results vary)</li>
                <li><strong>Background:</strong> Clean, simple backgrounds or transparent backgrounds</li>
                <li><strong>Lighting:</strong> Well-lit images with clear details</li>
                <li><strong>Perspective:</strong> Front-facing or 3/4 angle views work best</li>
                <li><strong>Cropping:</strong> Object should fill most of the frame without too much empty space</li>
                <li><strong>Aspect ratio:</strong> 1:1 square images are recommended</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="optimize">
            <AccordionTrigger>Tips for Best AI Staging Results</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use isolated furniture images (single items per image)</li>
                <li>Avoid images with people, pets, or other distracting elements</li>
                <li>Include multiple angles if possible (main image should be primary view)</li>
                <li>Use descriptive, accurate names to help the AI understand the item</li>
                <li>Include detailed descriptions with materials, colors, and dimensions</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </AlertDescription>
    </Alert>
  );
};

export default ImageGuidelinesInfo;
