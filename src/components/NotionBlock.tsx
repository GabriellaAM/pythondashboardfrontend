import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, Heading1, Heading2, Type, AlignLeft, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type BlockType = 'header' | 'subheader' | 'text' | 'description';

interface NotionBlockProps {
  value: string;
  type: BlockType;
  onChange: (value: string) => void;
  onTypeChange?: (type: BlockType) => void;
  onDelete?: () => void;
  onEnter?: () => void; // Called when user presses Enter to create new block
  placeholder?: string;
  className?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  disabled?: boolean;
  showTypeMenu?: boolean;
}

export function NotionBlock({
  value,
  type,
  onChange,
  onTypeChange,
  onDelete,
  onEnter,
  placeholder,
  className = "",
  autoSave = true,
  autoSaveDelay = 1000,
  disabled = false,
  showTypeMenu = true,
}: NotionBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const blockRef = useRef<HTMLDivElement>(null);

  const isMultiline = type === 'description' || type === 'text';

  // Update local state when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Auto-focus on empty blocks when mounted
  useEffect(() => {
    if (!value && blockRef.current) {
      setIsEditing(true);
    }
  }, []); // Only run once on mount

  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !isEditing || editValue === value) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (editValue !== value) {
        setIsSaving(true);
        await onChange(editValue.trim());
        setIsSaving(false);
      }
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editValue, value, autoSave, autoSaveDelay, onChange, isEditing]);

  const handleClick = () => {
    if (disabled || isEditing) return;
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (!isEditing) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsEditing(false);

    if (editValue.trim() !== value) {
      setIsSaving(true);
      await onChange(editValue.trim());
      setIsSaving(false);
    }

    // If empty on blur, delete the block
    if (editValue.trim() === "" && onDelete) {
      onDelete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!isMultiline || (isMultiline && e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        // Save current content first
        if (editValue.trim() !== value) {
          onChange(editValue.trim());
        }
        // Create new block below if onEnter is provided
        if (onEnter && !isMultiline) {
          onEnter();
        }
      }
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    } else if (e.key === 'Backspace' && editValue === '' && onDelete) {
      e.preventDefault();
      onDelete();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  };

  const handleTypeChange = (newType: BlockType) => {
    if (onTypeChange) {
      onTypeChange(newType);
    }
  };

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      if (editRef.current.tagName === 'INPUT') {
        (editRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (type) {
      case 'header': return "Header";
      case 'subheader': return "Subheader";
      case 'description': return "Add a description...";
      case 'text': return "Add text...";
      default: return "Click to add text...";
    }
  };

  const getTextClassName = () => {
    const baseClasses = "w-full border-none outline-none bg-transparent focus:ring-0 focus:border-none p-0 m-0";
    switch (type) {
      case 'header':
        return cn(baseClasses, "text-2xl font-bold text-foreground");
      case 'subheader':
        return cn(baseClasses, "text-xl font-semibold text-foreground");
      case 'description':
        return cn(baseClasses, "text-muted-foreground text-base leading-relaxed");
      case 'text':
        return cn(baseClasses, "text-foreground text-base");
      default:
        return baseClasses;
    }
  };

  const getDisplayClassName = () => {
    switch (type) {
      case 'header':
        return "text-2xl font-bold text-foreground";
      case 'subheader':
        return "text-xl font-semibold text-foreground";
      case 'description':
        return "text-muted-foreground text-base leading-relaxed";
      case 'text':
        return "text-foreground text-base";
      default:
        return "";
    }
  };

  const getMaxLength = () => {
    switch (type) {
      case 'header':
      case 'subheader':
        return 100;
      case 'description':
        return 500;
      default:
        return 1000;
    }
  };

  const isEmpty = !value;
  const displayValue = value || getPlaceholder();

  return (
    <div
      ref={blockRef}
      className={cn(
        "group relative flex items-center gap-2 py-1 transition-all",
        showMenu && showTypeMenu ? "pl-10" : "",
        className
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Menu lateral (aparece ao passar o mouse) */}
      {showTypeMenu && (
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity cursor-grab active:cursor-grabbing drag-handle",
          showMenu ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleTypeChange('header')}>
                <Heading1 className="w-4 h-4 mr-2" />
                Header
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('subheader')}>
                <Heading2 className="w-4 h-4 mr-2" />
                Subheader
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('text')}>
                <Type className="w-4 h-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTypeChange('description')}>
                <AlignLeft className="w-4 h-4 mr-2" />
                Description
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuItem className="border-t mt-1 pt-1" />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Conteúdo editável */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="relative">
            {isMultiline ? (
              <textarea
                ref={editRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(getTextClassName(), "resize-none")}
                placeholder={getPlaceholder()}
                rows={Math.max(1, editValue.split('\n').length)}
                style={{ minHeight: '1.5em' }}
                maxLength={getMaxLength()}
              />
            ) : (
              <input
                ref={editRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={editValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={getTextClassName()}
                placeholder={getPlaceholder()}
                maxLength={getMaxLength()}
              />
            )}
            {isSaving && (
              <div className="absolute -right-16 top-0 text-xs text-muted-foreground">
                Saving...
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={cn(
              disabled ? "cursor-default" : "cursor-text transition-colors rounded px-2 py-1 -mx-2 -my-1 hover:bg-muted/30",
              isEmpty && "text-muted-foreground/60",
              getDisplayClassName()
            )}
          >
            {isSaving ? (
              <span className="text-xs text-muted-foreground">Saving...</span>
            ) : (
              displayValue
            )}
          </div>
        )}
      </div>
    </div>
  );
}
