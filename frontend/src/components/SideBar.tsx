import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

export const SideBar = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        console.log("Profile button clicked for user:", user);
        if (!user) {
            // not logged in yet – either block or open login
            // e.g. show a toast or call your login handler
            return;
        }
        
        console.log("Profile button clicked for user:", user);
        navigate(`/u/${user.handle}`);
    }
    return (
        <div className="flex flex-col bg-app-panel rounded-lg p-4">
            <Button asChild variant="ghost" size="default" className="mb-2">
                <Link to="/">
                <Home/>
                 Home
                </Link>
            </Button>
            <Button variant="ghost" size="default" className="mb-2" onClick={handleProfileClick}>
                Profile
            </Button>
            <Button variant="ghost" size="default" className="mb-2">Settings</Button>
            <Button variant="ghost" size="default" className="mb-2">Logout</Button>
        </div> );
};
