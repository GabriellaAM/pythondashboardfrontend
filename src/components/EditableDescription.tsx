import { useState, useRef, useEffect } from "react";
import { Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "@/hooks/use-toast";

interface EditableDescriptionProps {
  dashboardId: string;
  description?: string;
  placeholder?: string;
}

export function EditableDescription({ 
  dashboardId, 
  description = "", 
  placeholder = "Add a description for this dashboard..." 
}: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentDashboard, setCurrentDashboard } = useDashboard();

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Update local state when description prop changes
  useEffect(() => {
    setEditValue(description);
  }, [description]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(description);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(description);
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Update dashboard description via API
      const updatedDashboard = await apiClient.updateDashboard(dashboardId, {
        description: editValue.trim() || undefined // Send undefined for empty descriptions
      });

      // Update current dashboard context
      if (currentDashboard && currentDashboard.id === dashboardId) {
        setCurrentDashboard({
          ...currentDashboard,
          description: editValue.trim() || undefined
        });
      }

      setIsEditing(false);
      
      toast({
        title: "Success",
        description: editValue.trim() 
          ? "Dashboard description updated" 
          : "Dashboard description removed",
      });
    } catch (error) {
      console.error('Failed to update description:', error);
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive"
      });
      
      // Revert to original value
      setEditValue(description);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none text-sm"
          disabled={isLoading}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2 h-8"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="gap-2 h-8"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
          <p className="text-xs text-muted-foreground ml-2">
            Press Ctrl+Enter to save, Esc to cancel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 cursor-pointer" onClick={handleStartEdit}>
      <div className="flex-1">
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-muted-foreground/60 text-sm italic">
            {placeholder}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
        onClick={(e) => {
          e.stopPropagation();
          handleStartEdit();
        }}
      >
        <Edit3 className="w-3 h-3" />
      </Button>
    </div>
  );
}