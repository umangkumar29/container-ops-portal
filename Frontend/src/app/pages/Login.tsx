import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Box, Server, Lock, Mail, ArrowRight } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

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
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 mb-8">Sign in to the Control Center to manage your environments.</p>

            {/* Glassmorphism Form Card */}
            <div className="p-8 rounded-3xl bg-[#0F1423]/80 border border-white/5 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handleLogin} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300 block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <input 
                      id="email"
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                      placeholder="admin@kportal.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-300 block">Password</label>
                    <button type="button" className="text-xs font-medium text-[#6366F1] hover:text-[#8B5CF6] transition-colors focus:outline-none">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <input 
                      id="password"
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden rounded-xl p-[1px]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] opacity-80 group-hover:opacity-100 transition-opacity"></span>
                    <div className="relative flex items-center justify-center gap-2 bg-[#6366F1] px-4 py-3 rounded-xl transition-all group-hover:bg-opacity-0">
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="font-semibold text-white tracking-wide">Sign In</span>
                          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>

              <div className="mt-8 flex items-center justify-center flex-col gap-4">
                 <div className="flex items-center w-full">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="px-4 text-xs text-slate-500 font-medium">OR</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                 </div>

                 <button className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-[#0B0F19] border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-medium transition-all group">
                    {/* Azure SVG Icon minimalist */}
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#0078D4]" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4 2.4L2.5 11.3l.9.9 8-8 8.8 8.8.9-.9-9.7-9.7z" fill="currentColor"/>
                      <path d="M2.5 11.3v9.8h9.8v-9.8H2.5zm8.9 8.9H3.4v-8h8v8z" fill="currentColor"/>
                      <path d="M12.6 11.3v9.8h8.9v-9.8h-8.9zm8 8.9h-7.1v-8h7.1v8z" fill="currentColor"/>
                    </svg>
                    <span>Sign in with Azure AD</span>
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
