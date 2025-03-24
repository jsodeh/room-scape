
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const JsonEditor = ({ value, onChange }: JsonEditorProps) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      // Try to parse and format the JSON for better readability
      const parsedJson = JSON.parse(pastedText);
      onChange(JSON.stringify(parsedJson, null, 2));
      e.preventDefault(); // Prevent the default paste behavior
    } catch (error) {
      // If not valid JSON, let the default paste behavior happen
    }
  };

  return (
    <Textarea 
      value={value}
      onChange={handleTextChange}
      onPaste={handlePaste}
      placeholder="Paste your JSON content here..."
      className="font-mono text-sm min-h-[300px]"
    />
  );
};

export default JsonEditor;
