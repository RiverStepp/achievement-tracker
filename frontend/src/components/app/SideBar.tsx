import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, CircleUser, Settings, LogOut, Search, Mail, Medal } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import logo from "@/assets/logo.png";
import { LoginOrSignup } from "./LoginOrSignup";

export const SideBar = () => {
  const { isAuthenticated, isLoading, logout, steamUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const handle = userProfile?.handle ?? null;
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
    if (!handle) return;
    navigate(`/u/${handle}`);
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

              <Button
                variant="ghost"
                size="lg"
                className="h-12 w-fit justify-start gap-4 px-4 app-heading"
              >
                <Link to="/settings" className="inline-flex items-center gap-4">
                  <Settings className="h-6 w-6 shrink-0" />
                  <span>Settings</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="h-12 w-fit justify-start gap-4 px-4 app-heading"
                onClick={logout}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                <span>Logout</span>
              </Button>
            </>
          )}
        </nav>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {isLoading ? null : isAuthenticated ? (
          <>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-app-muted">{displayName}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <LoginOrSignup />
        )}
      </div>
    </div>
    
  );
};
