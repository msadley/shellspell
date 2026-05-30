import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "ADMIN" | "PLAYER";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { username, role, sessionCode } = useAuthStore();
  const { code } = useParams<{ code?: string }>();

  if (!username) {
    // Redirect to home/login if no username exists (not logged in)
    return <Navigate to={requiredRole === "ADMIN" ? "/admin" : "/"} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect if user does not have the required role
    return <Navigate to={requiredRole === "ADMIN" ? "/admin" : "/"} replace />;
  }

  // If player session is active, verify that the session code matches the URL session code
  if (role === "PLAYER" && code && sessionCode && code.toUpperCase() !== sessionCode.toUpperCase()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
