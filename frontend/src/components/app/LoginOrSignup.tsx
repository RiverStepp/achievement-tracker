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
                        <Button variant="ghost" size="sm">Login</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Login </DialogTitle>
                            <DialogDescription>
                                <p className="mb-4">Please log in:</p>
                                <Button variant="outline" size="sm" onClick={loginWithSteam}>
                                    Login with Steam
                                </Button>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
                <span className="text-gray-300">|</span>
                <Dialog>
                    <DialogTrigger>
                        <Button variant="ghost" size="sm">Signup</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Signup</DialogTitle>
                            <DialogDescription>
                                <p className="mb-4">Please Sign up using your Steam account:</p>
                                <Button variant="outline" size="sm" onClick={loginWithSteam}>
                                    Register with Steam
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
