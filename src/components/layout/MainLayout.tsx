import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-grid relative overflow-x-hidden">
        <div className="ambient-glow-static" />
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full relative z-10">
          <Topbar />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
