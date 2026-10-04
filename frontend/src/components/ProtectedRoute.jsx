import { Navigate, useLocation } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useAuth, homeFor } from "../context/AuthContext";
import { LoadingState } from "./LoadingState";
import { Btn } from "./Layout";

export const ProtectedRoute = ({ role, children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (user === null) return <LoadingState label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) {
    return (
      <div className="panel mx-auto my-10 max-w-lg p-8 text-center" data-testid="access-denied">
        <ShieldX className="mx-auto h-10 w-10 text-amber-400" />
        <h2 className="mt-4 font-display text-2xl font-bold text-white">Municipal officers only</h2>
        <p className="mt-2 text-sm text-slate-400">This area is restricted to the admin dashboard. Your citizen dashboard has everything you reported.</p>
        <a href={homeFor(user)} className="mt-6 inline-block"><Btn>Go to my dashboard</Btn></a>
      </div>
    );
  }
  return children;
};
