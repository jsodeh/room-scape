
import { ReactNode } from "react";
import { Tabs as RadixTabs } from "@radix-ui/react-tabs";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabsWrapperProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
};

const TabsWrapper = ({ value, onValueChange, children, className }: TabsWrapperProps) => {
  return (
    <RadixTabs value={value} onValueChange={onValueChange} className={className}>
      {children}
    </RadixTabs>
  );
};

export { TabsWrapper, TabsList, TabsTrigger, TabsContent };
