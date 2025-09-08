import { useState } from "react";
import { Share } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ShareDashboardModal } from "@/components/ShareDashboardModal";
import { useDashboard } from "@/contexts/DashboardContext";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
  const { id: dashboardId } = useParams();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { currentDashboard } = useDashboard();

  const headerActions = (
    <>
      <Button 
        onClick={() => setIsShareModalOpen(true)} 
        variant="outline" 
        className="gap-2"
      >
        <Share className="w-4 h-4" />
        Share
      </Button>
    </>
  );

  return (
    <>
      <Layout headerActions={headerActions}>
        <Dashboard />
      </Layout>
      
      <ShareDashboardModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dashboardId={dashboardId || ''}
        dashboardName={currentDashboard?.name || 'Dashboard'}
      />
    </>
  );
}