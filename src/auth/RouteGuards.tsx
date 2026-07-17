import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center bg-slate-950 text-slate-400">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RedirectIfAuthenticated() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center bg-slate-950 text-slate-400">
        Loading…
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
