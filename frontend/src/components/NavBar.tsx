import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";

export const NavBar = () => {
  const { user, isLoading, loginWithSteam, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-app-panel border-b border-app-border">
      <div className="flex items-center gap-3">
        {/* Replace with actual logo image later */}
        <div className="h-8 w-8 rounded bg-brand" />
        <span className="font-semibold text-lg text-app-text">
          OpenAchievements
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isLoading ? null : user ? (
          <>
            {/* You can show user.username here if you want */}
            {/* <span className="text-sm text-app-muted">{user.username}</span> */}
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={loginWithSteam}>
            Login with Steam
          </Button>
        )}
      </div>
    </div>
  );
};