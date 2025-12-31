import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
export const SideBar = () => {
    return (
        <div className="flex flex-col bg-app-panel rounded-lg">
            <Button asChild variant="ghost" size="default" className="mb-2">
                <Link to="/">
                <Home/>
                 Home
                </Link>
            </Button>
            <Button variant="ghost" size="default" className="mb-2">Profile</Button>
            <Button variant="ghost" size="default" className="mb-2">Settings</Button>
            <Button variant="ghost" size="default" className="mb-2">Logout</Button>
        </div> );
};
