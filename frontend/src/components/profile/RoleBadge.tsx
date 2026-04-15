import { AppUserRole } from "@/types/models";

type RoleBadgeProps = {
    role: AppUserRole;
};
export const RoleBadge = ({ role }: RoleBadgeProps) => {
    if (role === "Admin") {
        return <span className=" mr-2 px-2 py-0.5 text-xs font-medium rounded bg-red-400 text-red-900">Admin</span>;
    }
    if (role === "Moderator") {
        return <span className="mr-2 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">Moderator</span>;
    }
    return <span className="mr-2 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">User</span>;
}