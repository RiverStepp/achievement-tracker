import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LoginOrSignup } from "./LoginOrSignup";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png"; // <- adjust name/extension if needed

export const NavBar = () => {
  const { user, isLoading, loginWithSteam, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-1">
      {/* Left: logo + brand name */}
      <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="OpenAchievements logo"
            className="h-32"
          />
      </Link>

      {/* Right: auth buttons */}
      <div className="ml-auto flex items-center gap-3">
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