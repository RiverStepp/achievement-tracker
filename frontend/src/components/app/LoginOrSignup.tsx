import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const LoginOrSignup = () => {
    const { isAuthenticated, isLoading, loginWithSteam, logout } = useAuth();
    return (
        <div className="ml-auto flex items-center gap-3">
            {isLoading ? null : isAuthenticated ? (
            <>
                <Button variant="outline" size="sm" onClick={logout}>
                Logout
                </Button>
            </>
            ) : (
            <div className="flex items-center gap-2">
                <Dialog>
                    <DialogTrigger>
                        <Button variant="outline" size="sm">Login</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Login </DialogTitle>
                            <DialogDescription>
                                <p className="mb-4">Choose your preferred login method:</p>
                                <Button variant="outline" size="sm" onClick={loginWithSteam}>
                                    Login with Steam
                                </Button>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>        
            
            )}
        </div>
    )
};
