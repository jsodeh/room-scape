
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InstructionsInputProps {
  instructions: string;
  onInstructionsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const InstructionsInput = ({ instructions, onInstructionsChange }: InstructionsInputProps) => {
  return (
    <div className="space-y-2 pt-2">
      <Label htmlFor="instructions" className="text-base">Staging Instructions</Label>
      <p className="text-sm text-muted-foreground">
        Provide specific instructions on how you'd like the room to be staged
      </p>
      <Textarea
        id="instructions"
        placeholder="E.g., Place the sofa against the longest wall, add plants for some greenery..."
        rows={5}
        value={instructions}
        onChange={onInstructionsChange}
        className="resize-none"
      />
    </div>
  );
};

export default InstructionsInput;
