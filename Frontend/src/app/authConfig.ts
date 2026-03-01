import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || ""}`,
        redirectUri: "http://localhost:5173",
        postLogoutRedirectUri: "http://localhost:5173"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
