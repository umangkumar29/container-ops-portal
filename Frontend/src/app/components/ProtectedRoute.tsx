import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const navigate = useNavigate();

  // If the URL contains an auth token hash from Azure AD, MSAL needs time to process it.
  const isHandlingRedirect = 
    inProgress !== "none" || 
    window.location.hash.includes("code=") || 
    window.location.hash.includes("state=");

  useEffect(() => {
    // Only kick the user exactly when MSAL says it's totally dormant
    // AND they are definitely not authenticated AND there is no token in the URL.
    if (!isAuthenticated && !isHandlingRedirect) {
      navigate('/login', { 
        replace: true, 
        state: { msAuthFailed: true } 
      });
    }
  }, [isAuthenticated, isHandlingRedirect, navigate]);

  // While MSAL is determining auth state, or processing a redirect, show a generic loading screen
  if (!isAuthenticated && isHandlingRedirect) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground font-sans">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] animate-pulse flex items-center justify-center shadow-[#6366F1]/20"></div>
            <p className="mt-4 text-sm text-slate-400">Authenticating session...</p>
        </div>
    );
  }

  if (!isAuthenticated && !isHandlingRedirect) {
      return null;
  }

  return <>{children}</>;
}
