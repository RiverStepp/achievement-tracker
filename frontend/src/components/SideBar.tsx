import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, CircleUser, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

export const SideBar = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!user) return;
    navigate(`/u/${user.handle}`);
  };

  return (
    <div className="lg:bg-app-panel rounded-lg p-4 lg:shadow-md lg:shadow-app-border">
      <nav className="flex flex-col items-start space-y-2">
        {/* Home – uses asChild + Link */}
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="h-12 w-fit justify-start gap-4 px-4 text-lg font-semibold"
        >
          <Link to="/" className="inline-flex items-center gap-4">
            <Home className="h-6 w-6 shrink-0" />
            <span>Home</span>
          </Link>
        </Button>

        {/* Only show these when logged in */}
        {!isLoading && user && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-fit justify-start gap-4 px-4 text-lg font-semibold"
              onClick={handleProfileClick}
            >
              <CircleUser className="h-6 w-6 shrink-0" />
              <span>Profile</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-fit justify-start gap-4 px-4 text-lg font-semibold"
            >
              <Settings className="h-6 w-6 shrink-0" />
              <span>Settings</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-fit justify-start gap-4 px-4 text-lg font-semibold"
              onClick={logout}
            >
              <LogOut className="h-6 w-6 shrink-0" />
              <span>Logout</span>
            </Button>
          </>
        )}
      </nav>
    </div>
  );
};
