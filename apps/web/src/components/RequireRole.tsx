import { ReactNode, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { Role } from "@snb/shared";
import { useApi } from "../hooks/useApi";

type Me = { id: string; email: string; role: Role };

export function RequireRole({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const api = useApi();
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    api
      .get<Me>("/users/me")
      .then(setMe)
      .finally(() => setChecked(true));
  }, [isAuthenticated, isLoading, api, loginWithRedirect]);

  if (isLoading || !checked) return <div className="p-8">Loading…</div>;
  if (!me) return <Navigate to="/" replace />;
  if (!allow.includes(me.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
