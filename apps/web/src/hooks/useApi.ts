import { useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { makeApi } from "../api";

export function useApi() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  return useMemo(
    () =>
      makeApi(async () => {
        if (!isAuthenticated) return undefined;
        try {
          return await getAccessTokenSilently();
        } catch {
          return undefined;
        }
      }),
    [getAccessTokenSilently, isAuthenticated],
  );
}
