import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotionEditableText } from "./NotionEditableText";

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
  onDelete: (id: string) => void;
}

export function EditableSection({ section, onUpdate, onDelete }: EditableSectionProps) {
  const handleUpdate = async (newTitle: string) => {
    if (!newTitle.trim()) {
      onDelete(section.id);
      return;
    }
    onUpdate(section.id, newTitle.trim());
  };

  return (
    <div className="py-2">
      <NotionEditableText
        value={section.title}
        onChange={handleUpdate}
        onBlurEmpty={() => onDelete(section.id)}
        placeholder={
          section.type === 'header' ? "Header" :
          section.type === 'subheader' ? "Subheader" :
          section.type === 'description' ? "Add a description..." :
          "Add text..."
        }
        className={
          section.type === 'header' ? "text-xl font-semibold text-foreground" :
          section.type === 'subheader' ? "text-lg font-medium text-foreground" :
          section.type === 'description' ? "text-muted-foreground text-base leading-relaxed" :
          "text-foreground text-base"
        }
        multiline={section.type === 'description' || section.type === 'text'}
        maxLength={
          section.type === 'header' || section.type === 'subheader' ? 100 :
          section.type === 'description' ? 500 : 1000
        }
      />
    </div>
  );
}