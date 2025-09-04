import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dashboardName: string;
  isLastDashboard?: boolean;
}

export function ConfirmDeleteModal({ 
  open, 
  onClose, 
  onConfirm, 
  dashboardName,
  isLastDashboard = false 
}: ConfirmDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Delete Dashboard
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left mt-1">
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">"{dashboardName}"</span>?
            {isLastDashboard && (
              <span className="block mt-2 text-destructive font-medium">
                ⚠️ You must have at least one dashboard. Create another dashboard first.
              </span>
            )}
          </p>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isLastDashboard}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Dashboard
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}