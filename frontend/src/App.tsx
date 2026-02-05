import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

import ProfilePage from "@/routes/ProfilePage";
import { HomePage } from "@/routes/HomePage";
import { AuthCallbackPage } from "@/routes/AuthCallbackPage";

import axios from "axios";

import { NavBar } from "@/components/app/NavBar";
import { SideBar } from "@/components/app/SideBar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log("Current user:", user);
  }, []);

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
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
        {/* Navbar (full width, unchanged behavior) */}
        <header className="p-4">
          <NavBar />
        </header>

        {/* Centered content area (THIS is the fix) */}
        <div className="w-full flex justify-center px-4 min-h-0">
          <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 min-h-0 h-full">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-6">
                <SideBar />
              </div>
            </aside>

            {/* Main routed content */}
            <main className="min-w-0 min-h-0 h-full">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/u/:handle" element={<ProfilePage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Routes>
            </main>
          </div>
        </div>

        {/* Footer (full width, unchanged) */}
        <footer>
          footer
        </footer>
      </div>
    </>
  );
};

export default App;
