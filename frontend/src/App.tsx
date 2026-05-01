import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import ProfilePage from "@/routes/ProfilePage";
import { HomePage } from "@/routes/HomePage";
import { AuthCallbackPage } from "@/routes/AuthCallbackPage";
import { MessagesPage } from "@/routes/MessagesPage";
import { GamePage } from "@/routes/GamePage";

import { SideBar } from "@/components/app/SideBar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { ChevronRight } from "lucide-react";
import { SettingsPage } from "./routes/SettingsPage";
import { LeaderboardPage } from "./routes/LeaderboardPage";
import { SearchPage } from "./routes/SearchPage";
import { CreateProfileDialog } from "@/components/profile/CreateProfileDialog";
import { CookieConsentBanner } from "@/components/app/CookieConsentBanner";
import { SiteFooter } from "@/components/app/SiteFooter";
import { TermsOfServicePage } from "@/routes/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/routes/PrivacyPolicyPage";

const App: React.FC = () => {
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";
  const isMessagesRoute = location.pathname === "/messages";
  const usesInternalScroll = isHomeRoute || isMessagesRoute;

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

 frontend--privacy-policy-tos
            {/* Routed content and footer: scroll area is inner wrapper only */}
            <main className="min-w-0 h-full min-h-0 py-4 flex flex-col">
              <div
                className={`flex-1 min-h-0 ${
                  usesInternalScroll
                    ? "overflow-hidden"
                    : "overflow-y-auto app-scrollbar"
                }`}
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/u/:profileKey" element={<ProfilePage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/games/:gameId" element={<GamePage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                </Routes>
              </div>
              <SiteFooter />
            {/* Routed content: ONLY scroll area */}
            <main
              className={`min-w-0 h-full min-h-0 py-4 ${
                usesInternalScroll ? "overflow-hidden" : "overflow-y-auto app-scrollbar"
              }`}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/u/:profileKey" element={<ProfilePage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/games/:gameId" element={<GamePage />} />

              </Routes>
            </main>
          </div>
        </div>
      </div>
      <CreateProfileDialog />
      <CookieConsentBanner />
      <Toaster />
    </>
  );
};

export default App;
