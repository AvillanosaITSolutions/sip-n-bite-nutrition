import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./index.css";

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const audience = (import.meta.env.VITE_AUTH0_AUDIENCE as string) || undefined;

if (!domain || !clientId) {
  throw new Error(
    `Missing Auth0 env vars. VITE_AUTH0_DOMAIN=${domain || "(empty)"} VITE_AUTH0_CLIENT_ID=${clientId || "(empty)"}. Check apps/web/.env and restart the dev server.`,
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>,
);
