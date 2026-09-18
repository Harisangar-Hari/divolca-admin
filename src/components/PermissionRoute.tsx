import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

interface Props {
    children: React.ReactNode;
    required: string;         // single permission key
    redirectTo?: string;      // default: "/"
}

export default function PermissionRoute({
    children,
    required,
    redirectTo = "/",
}: Props) {
    const { can, user } = usePermissions();

    // Not logged in? Bounce to login (ProtectedRoute should handle this first anyway)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but lacks permission — bounce to dashboard
    if (!can(required)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}