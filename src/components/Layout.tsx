import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BarChart3 } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shadow-soft">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-primary-foreground" />
                </div>
                <h1 className="font-semibold text-foreground">DataViz Pro</h1>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto bg-gradient-subtle">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}