import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, CircleUser, Settings, LogOut, Search, Mail } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import logo from "@/assets/logo.png";
import { LoginOrSignup } from "./LoginOrSignup";

export const SideBar = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!user) return;
    navigate(`/u/${user.handle}`);
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
            <Link to="/explore" className="inline-flex items-center gap-4">
              <Search className="h-6 w-6 shrink-0" />
              <span>Explore</span>
            </Link>
          </Button>

          {/* Only show these when logged in */}
          {!isLoading && user && (
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
                <Settings className="h-6 w-6 shrink-0" />
                <span>Settings</span>
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
        {isLoading ? null : user ? (
          <>
            {/* <span className="text-sm text-app-muted">{user.username}</span> */}
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
