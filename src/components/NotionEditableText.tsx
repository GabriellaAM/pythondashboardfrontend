import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NotionEditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  maxLength?: number;
  disabled?: boolean;
  onBlurEmpty?: () => void;
  showPlaceholderText?: boolean;
}

export function NotionEditableText({
  value,
  onChange,
  placeholder = "Click to add text...",
  className = "",
  multiline = false,
  autoSave = true,
  autoSaveDelay = 1000,
  maxLength,
  disabled = false,
  onBlurEmpty,
  showPlaceholderText = true
}: NotionEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local state when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !isEditing || editValue === value) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
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
    
    // Always persist on blur (immediate save), regardless of autoSave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsEditing(false);

    if (editValue.trim() !== value) {
      setIsSaving(true);
      await onChange(editValue.trim());
      setIsSaving(false);
    }

    // If empty on blur, notify parent (used to remove empty items)
    if (editValue.trim() === "") {
      onBlurEmpty?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      // Persist immediately on Enter
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      editRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    setEditValue(newValue);
  };

  // Auto-focus and select when editing starts
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      if (editRef.current.tagName === 'INPUT') {
        (editRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  // Show placeholder if no value
  const displayValue = value || placeholder;
  const isEmpty = !value;

  // If empty and placeholder should be hidden, render nothing (non-edit state)
  // but still allow showing a saving indicator if saving.
  if (!isEditing && isEmpty && !showPlaceholderText && !isSaving) {
    return null;
  }

  if (isEditing) {
    if (multiline) {
      return (
        <div className="relative">
          <textarea
            ref={editRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full resize-none border-none outline-none bg-transparent",
              "focus:ring-0 focus:border-none p-0 m-0",
              className
            )}
            placeholder={placeholder}
            rows={Math.max(1, editValue.split('\n').length)}
            style={{ minHeight: '1.5em' }}
          />
          {isSaving && (
            <div className="absolute -right-6 top-0 text-xs text-muted-foreground">
              Saving...
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <input
          ref={editRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full border-none outline-none bg-transparent",
            "focus:ring-0 focus:border-none p-0 m-0",
            className
          )}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {isSaving && (
          <div className="absolute -right-12 top-0 text-xs text-muted-foreground">
            Saving...
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        disabled ? "cursor-default" : "cursor-text transition-colors hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 -my-0.5",
        isEmpty && "text-muted-foreground/60",
        className
      )}
    >
      {isSaving ? (
        <span className="text-xs text-muted-foreground">Saving...</span>
      ) : isEmpty && !showPlaceholderText ? (
        <span className="inline-block" style={{ minHeight: multiline ? '1.5em' : undefined }} />
      ) : (
        displayValue
      )}
    </div>
  );
}