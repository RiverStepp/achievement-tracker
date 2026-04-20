import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, CircleUser, Settings, LogOut, Mail, Medal, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import logo from "@/assets/logo.png";
import { LoginOrSignup } from "./LoginOrSignup";

export const SideBar = () => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated, isLoading, logout, steamUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const handle = userProfile?.handle ?? null;
  const publicId = userProfile?.user.publicId ?? null;
  const displayName =
    userProfile?.displayName ||
    userProfile?.steam?.personaName ||
    steamUser?.personaName ||
    "Account";
  const avatarUrl =
    userProfile?.avatarUrl ||
    userProfile?.steam?.avatarMediumUrl ||
    userProfile?.steam?.avatarFullUrl ||
    steamUser?.avatarMediumUrl ||
    "https://placehold.co/64x64?text=U";

  const handleProfileClick = () => {
    const profileKey = publicId ?? handle;
    if (!profileKey) return;
    navigate(`/u/${profileKey}`);
  };

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  const handleOpenSettings = () => {
    setIsAccountMenuOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
  };

  return (
    <div>
      <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="OpenAchievements logo"
            className="h-24 w-auto"
          />
      </Link>
      <div className="lg:bg-app-panel rounded-lg p-4 lg:shadow-md lg:shadow-app-border">
        <nav className="flex flex-col items-start space-y-2">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 w-fit justify-start gap-4 px-4 app-heading"
          >
            <Link to="/" className="inline-flex items-center gap-4">
              <Home className="h-6 w-6 shrink-0" />
              <span>Home</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 w-fit justify-start gap-4 px-4 app-heading"
          >
            <Link to="/leaderboard" className="inline-flex items-center gap-4">
              <Medal className="h-6 w-6 shrink-0" />
              <span>Leaderboard</span>
            </Link>
          </Button>

          {/* Only show these when logged in */}
          {!isLoading && isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 w-fit justify-start gap-4 px-4 app-heading"
                onClick={handleProfileClick}
              >
                <CircleUser className="h-6 w-6 shrink-0" />
                <span>Profile</span>
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="h-12 w-fit justify-start gap-4 px-4 app-heading"
              >
                <Link to="/messages" className="inline-flex items-center gap-4">
                  <Mail className="h-6 w-6 shrink-0" />
                  <span>Messages</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
      <div className="mt-4">
        {isLoading ? null : isAuthenticated ? (
          <div ref={accountMenuRef} className="relative">
            <div className="overflow-hidden rounded-lg bg-app-panel shadow-md shadow-app-border">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className={`flex w-full items-center justify-between gap-3 px-2 py-2 text-left transition-colors hover:bg-app-bg ${
                  isAccountMenuOpen ? "rounded-t-lg border-b border-app-border" : "rounded-lg"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-app-text">
                      {displayName}
                    </p>
                    {handle ? (
                      <p className="truncate text-xs text-app-muted">@{handle}</p>
                    ) : null}
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-app-muted" />
              </button>

              {isAccountMenuOpen ? (
                <div className="border-t border-app-border p-2">
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-app-text transition-colors hover:bg-app-bg"
                  >
                    <Settings className="h-5 w-5 shrink-0 text-app-muted" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-app-text transition-colors hover:bg-app-bg"
                  >
                    <LogOut className="h-5 w-5 shrink-0 text-app-muted" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <LoginOrSignup />
        )}
      </div>
    </div>
    
  );
};
