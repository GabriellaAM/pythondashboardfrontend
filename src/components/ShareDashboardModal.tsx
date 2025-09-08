import { useState } from "react";
import { Share, Mail, UserCheck, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/api";

interface ShareDashboardModalProps {
  open: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardName: string;
}

export function ShareDashboardModal({
  open,
  onClose,
  dashboardId,
  dashboardName,
}: ShareDashboardModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.shareDashboardWithUser(dashboardId, email.trim(), permission);
      setSuccess(`Dashboard shared successfully with ${email}`);
      setEmail("");
      setPermission('view');
      
      // Trigger refresh of shared dashboards in sidebar
      if ((window as any).reloadSharedDashboards) {
        (window as any).reloadSharedDashboards();
      }
      
      // Dispatch custom event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('shared-dashboards-changed'));
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        setError("User with this email is not registered in the system");
      } else if (err.status === 409) {
        setError("Dashboard is already shared with this user");
      } else {
        setError(err.message || "Failed to share dashboard. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPermission('view');
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Share className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Share Dashboard</DialogTitle>
              <DialogDescription className="mt-1">
                Share "{dashboardName}" with a registered user
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleShare()}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The user must have an existing account to receive access
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={permission === 'view' ? 'default' : 'outline'}
                onClick={() => setPermission('view')}
                disabled={isLoading}
              >
                View only
              </Button>
              <Button
                type="button"
                variant={permission === 'edit' ? 'default' : 'outline'}
                onClick={() => setPermission('edit')}
                disabled={isLoading}
              >
                Can edit
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              "View only": cannot create/edit/delete. "Can edit": full editing access.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isLoading || !email.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share className="w-4 h-4" />
                Share Dashboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}