import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotionBlock, BlockType } from "./NotionBlock";

interface Section {
  id: string;
  title: string;
  type: 'header' | 'subheader' | 'text' | 'description';
}

interface AddSectionButtonProps {
  onAddSection: (title: string, type: 'header' | 'subheader' | 'text' | 'description') => void;
}

export function AddSectionButton({ onAddSection }: AddSectionButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleAddHeader = () => {
    onAddSection("", 'header');
    setShowOptions(false);
  };

  const handleAddSubheader = () => {
    onAddSection("", 'subheader');
    setShowOptions(false);
  };

  const handleAddText = () => {
    onAddSection("", 'text');
    setShowOptions(false);
  };

  const handleAddDescription = () => {
    onAddSection("", 'description');
    setShowOptions(false);
  };

  if (showOptions) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddHeader}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Header
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddSubheader}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Subheader
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddText}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Text
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddDescription}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Description
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowOptions(true)}
      className="gap-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Plus className="w-4 h-4" />
      Add section
    </Button>
  );
}

interface EditableSectionProps {
  section: Section;
  onUpdate: (id: string, title: string) => void;
  onUpdateType?: (id: string, type: BlockType) => void;
  onDelete: (id: string) => void;
  onEnter?: (id: string) => void;
}

export function EditableSection({ section, onUpdate, onUpdateType, onDelete, onEnter }: EditableSectionProps) {
  const handleUpdate = async (newTitle: string) => {
    if (!newTitle.trim()) {
      onDelete(section.id);
      return;
    }
    onUpdate(section.id, newTitle.trim());
  };

  const handleTypeChange = async (newType: BlockType) => {
    if (onUpdateType) {
      onUpdateType(section.id, newType);
    }
  };

  const handleEnter = () => {
    if (onEnter) {
      onEnter(section.id);
    }
  };

  return (
    <NotionBlock
      value={section.title}
      type={section.type}
      onChange={handleUpdate}
      onTypeChange={handleTypeChange}
      onDelete={() => onDelete(section.id)}
      onEnter={handleEnter}
      showTypeMenu={true}
    />
  );
}