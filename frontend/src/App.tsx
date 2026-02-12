import React from "react";
import { Route, Routes } from "react-router-dom";

import ProfilePage from "@/routes/ProfilePage";
import { HomePage } from "@/routes/HomePage";
import { AuthCallbackPage } from "@/routes/AuthCallbackPage";

import { SideBar } from "@/components/app/SideBar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const App: React.FC = () => {
  return (
    <>
      {/*Mobile Sidebar Overlay*/}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-2 top-36 z-50 rounded-full"
              aria-label="Open sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px]">
            <SideBar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Layout */}
      <div className="h-screen overflow-hidden">
        <div className="mx-auto h-full w-full max-w-[1400px] px-4">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
            {/* Desktop sidebar: fixed, never scrolls */}
            <aside className="hidden lg:block h-full">
              <div className="h-full">
                <SideBar />
              </div>
            </aside>

            {/* Routed content: ONLY scroll area */}
            <main className="min-w-0 h-full min-h-0 overflow-y-auto py-4 app-scrollbar">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/u/:handle" element={<ProfilePage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
