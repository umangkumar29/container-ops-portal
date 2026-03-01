import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Box, Server, ArrowRight, AlertCircle } from 'lucide-react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // If we came here from a ProtectedRoute kick, we might have an error state
  const authFailedWarning = location.state?.msAuthFailed;

  const [isLoading, setIsLoading] = useState(inProgress !== "none");

  // Keep loading state synced with MSAL progress
  useEffect(() => {
    if (inProgress !== "none") {
      setIsLoading(true);
    }
  }, [inProgress]);

  // If already authenticated by MSAL, jump straight to the dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await instance.loginRedirect({
        ...loginRequest,
        prompt: 'select_account' // Forces the prompt to ask for email/password
      });
      // After redirect, the entire window will go to the Azure AD login
    } catch (e) {
      console.error('Azure AD Login Failed', e);
      setIsLoading(false);
    }
  };

  // Prevent flash of login UI if we are already authenticated and about to redirect
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#0B0F19] text-white font-sans overflow-hidden">
      
      {/* Left Panel: Tech Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E1B4B]">
        {/* Abstract shapes & glow */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-[#6366F1] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-[#8B5CF6] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
        
        {/* Floating Icons Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              KPortal
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-extrabold tracking-tight mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          >
            Orchestrate Your Enterprise Edge
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-400 mb-10 leading-relaxed"
          >
            Securely manage, scale, and monitor your Azure Container Apps seamlessly across all environments.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="grid grid-cols-2 gap-4"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
               <Server className="w-6 h-6 text-[#6366F1]" />
               <span className="font-semibold text-sm">Container Management</span>
               <span className="text-xs text-slate-400">Instantly deploy & manage microservices.</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2">
               <Shield className="w-6 h-6 text-[#10B981]" />
               <span className="font-semibold text-sm">Enterprise Security</span>
               <span className="text-xs text-slate-400">Zero-trust architecture & access control.</span>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 mt-auto text-sm text-slate-500 font-medium tracking-wide">
          © {new Date().getFullYear()} KPortal Systems. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative bg-[#090C15]">
        {/* Subtle glow for form side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6366F1] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.03] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 lg:hidden flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              KPortal
            </span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-white mb-3">Enterprise Access</h2>
            <p className="text-slate-400 mb-10 text-lg">Sign in to the Control Center to manage your environments.</p>

            {/* Glassmorphism Form Card */}
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-[#0F1423]/80 border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col items-center">
              
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0078D4]/20 to-[#6366F1]/20 flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                <Shield className="w-10 h-10 text-[#0078D4]" />
              </div>

              <h3 className="text-xl font-semibold text-slate-200 mb-2">Microsoft Entra ID</h3>
              <p className="text-sm text-center text-slate-500 mb-6">
                Authentication is secured and managed by your organization's Azure Active Directory.
              </p>

              {authFailedWarning && !isLoading && (
                <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200 leading-relaxed">
                    Session expired or authentication failed. Please sign in again to access the control center.
                  </p>
                </div>
              )}

              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-xl p-[1px]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#0078D4] to-[#6366F1] opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative flex items-center justify-center gap-3 bg-[#0B0F19] hover:bg-opacity-0 px-6 py-4 rounded-xl transition-all duration-300">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {/* Azure SVG Icon minimalist */}
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#0078D4] group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4 2.4L2.5 11.3l.9.9 8-8 8.8 8.8.9-.9-9.7-9.7z" fill="currentColor"/>
                        <path d="M2.5 11.3v9.8h9.8v-9.8H2.5zm8.9 8.9H3.4v-8h8v8z" fill="currentColor"/>
                        <path d="M12.6 11.3v9.8h8.9v-9.8h-8.9zm8 8.9h-7.1v-8h7.1v8z" fill="currentColor"/>
                      </svg>
                      <span className="font-semibold text-white tracking-wide text-lg">Sign in with Azure</span>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </div>
              </button>

            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
