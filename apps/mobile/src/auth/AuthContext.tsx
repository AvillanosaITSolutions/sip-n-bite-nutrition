import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { tokenStorage } from "../lib/tokenStorage";
import type { Role } from "@snb/shared";
import { config } from "../config";
import { makeApi, type Api } from "../api";

WebBrowser.maybeCompleteAuthSession();

const REFRESH_TOKEN_KEY = "snb.auth.refreshToken";

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${config.auth0Domain}/authorize`,
  tokenEndpoint: `https://${config.auth0Domain}/oauth/token`,
  revocationEndpoint: `https://${config.auth0Domain}/oauth/revoke`,
};

export const redirectUri = AuthSession.makeRedirectUri({ scheme: "snbmobile" });

export type Me = { id: string; email: string; name?: string | null; role: Role };

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  me: Me | null;
  api: Api;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch /users/me (e.g. after a role change). */
  refreshMe: () => Promise<void>;
};

type Tokens = {
  accessToken: string;
  /** Epoch ms after which the access token should be refreshed. */
  expiresAt: number;
  refreshToken?: string;
};

const AuthContext = createContext<AuthState | null>(null);

function tokensFromResponse(r: AuthSession.TokenResponse, fallbackRefresh?: string): Tokens {
  const expiresIn = r.expiresIn ?? 3600;
  return {
    accessToken: r.accessToken,
    // refresh 60s before actual expiry
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
    refreshToken: r.refreshToken ?? fallbackRefresh,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const tokensRef = useRef<Tokens | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearSession = useCallback(async () => {
    tokensRef.current = null;
    setIsAuthenticated(false);
    setMe(null);
    await tokenStorage.delete(REFRESH_TOKEN_KEY).catch(() => undefined);
  }, []);

  const refreshWith = useCallback(async (refreshToken: string): Promise<Tokens | null> => {
    try {
      const r = await AuthSession.refreshAsync(
        {
          clientId: config.auth0ClientId,
          refreshToken,
          extraParams: config.auth0Audience ? { audience: config.auth0Audience } : {},
        },
        discovery,
      );
      const t = tokensFromResponse(r, refreshToken);
      if (t.refreshToken) {
        await tokenStorage.set(REFRESH_TOKEN_KEY, t.refreshToken);
      }
      return t;
    } catch {
      return null;
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    const t = tokensRef.current;
    if (t && Date.now() < t.expiresAt) return t.accessToken;
    const refreshToken =
      t?.refreshToken ?? (await tokenStorage.get(REFRESH_TOKEN_KEY).catch(() => null));
    if (!refreshToken) return undefined;
    const next = await refreshWith(refreshToken);
    if (!next) {
      await clearSession();
      return undefined;
    }
    tokensRef.current = next;
    setIsAuthenticated(true);
    return next.accessToken;
  }, [refreshWith, clearSession]);

  const api = useMemo(() => makeApi(getToken), [getToken]);

  const loadMe = useCallback(async () => {
    try {
      const m = await api.get<Me>("/users/me");
      setMe(m);
    } catch {
      setMe(null);
    }
  }, [api]);

  // Restore session on launch from the stored refresh token.
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          setIsAuthenticated(true);
          await loadMe();
        }
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    const request = new AuthSession.AuthRequest({
      clientId: config.auth0ClientId,
      redirectUri,
      scopes: ["openid", "profile", "email", "offline_access"],
      usePKCE: true,
      extraParams: config.auth0Audience ? { audience: config.auth0Audience } : {},
    });
    const result = await request.promptAsync(discovery);
    if (result.type !== "success" || !result.params.code) return;
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: config.auth0ClientId,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? "" },
      },
      discovery,
    );
    const t = tokensFromResponse(tokenResponse);
    tokensRef.current = t;
    if (t.refreshToken) await tokenStorage.set(REFRESH_TOKEN_KEY, t.refreshToken);
    setIsAuthenticated(true);
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    await clearSession();
    // Also end the Auth0 SSO session in the browser so the next login prompts.
    const returnTo = encodeURIComponent(redirectUri);
    await WebBrowser.openAuthSessionAsync(
      `https://${config.auth0Domain}/v2/logout?client_id=${config.auth0ClientId}&returnTo=${returnTo}`,
      redirectUri,
    ).catch(() => undefined);
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({ isLoading, isAuthenticated, me, api, login, logout, refreshMe: loadMe }),
    [isLoading, isAuthenticated, me, api, login, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useApi(): Api {
  return useAuth().api;
}
