import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginOrSignup } from "@/components/app/LoginOrSignup";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png"; // <- adjust name/extension if needed

export const NavBar = () => {
  const { isAuthenticated, isLoading, steamUser, userProfile, logout } = useAuth();
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

  return (
    <div className="flex items-center justify-between">
      {/* Left: logo + brand name */}
      <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="OpenAchievements logo"
            className="h-24 w-auto"
          />
      </Link>

      {/* Right: auth buttons */}
      <div className="ml-auto flex items-center gap-3">
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
