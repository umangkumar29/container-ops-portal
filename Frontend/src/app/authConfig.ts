import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

export const AUTH_BYPASS = (import.meta.env.VITE_AUTH_BYPASS ?? "").toLowerCase() === "true";

// Config object to be passed to MSAL when authentication is enabled
export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || ""}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
};

// Scopes needed for the frontend. When bypassing auth we do not request any tokens.
export const loginRequest = AUTH_BYPASS
    ? { scopes: [] }
    : {
        scopes: [
            "User.Read",
        ],
    };

// Create the MSAL instance only when authentication is enabled
export const msalInstance = AUTH_BYPASS ? null : new PublicClientApplication(msalConfig);
 
 