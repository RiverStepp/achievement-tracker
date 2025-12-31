import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import ProfilePage from "@/routes/ProfilePage";
import { HomePage } from "@/routes/HomePage";
import axios from "axios";
import { NavBar } from "@/components/NavBar";
import { SideBar } from "@/components/SideBar";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const App: React.FC = () => {
  useEffect(() => {
    axios
      .get<string>("https://localhost:7111/WeatherForecast/ping")
      .then(({ data }) => console.log("ping:", data))
      .catch(console.error);
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

      {/* Main Layout*/}
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Navbar */}
        <header className="p-4 lg:col-span-2">
          <NavBar />
        </header>

        {/* Desktop sidebar */}
        <aside className="p-4 hidden lg:block">
          <SideBar />
        </aside>

        {/* Main routed content (homepage, profilepage, etc.) */}
        <main className="p-4 min-w-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/u/:handle" element={<ProfilePage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="lg:col-span-2">
          footer
        </footer>
      </div>
    </>
  );
};

export default App;
