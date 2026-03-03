import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Terminal, 
  Cloud, 
  Code, 
  Layers, 
  Activity, 
  Settings, 
  Bell, 
  RefreshCw,
  UserCircle,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useMsal } from '@azure/msal-react';

import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
  userName?: string;
  onSync?: () => void;
  isSyncing?: boolean;
  subscriptions?: { id: string; name: string }[];
  activeSub?: string;
  onSubChange?: (id: string) => void;
}

export function DashboardLayout({ 
  children, 
  userRole = 'Superadmin', 
  userName = 'Guest', 
  onSync,
  isSyncing = false,
  subscriptions = [],
  activeSub,
  onSubChange
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  
  // Local state fallback if not controlled
  const [localActiveSub, setLocalActiveSub] = useState(subscriptions?.[0]?.id || '');
  
  // Update local active sub when data loads if it was empty
  useEffect(() => {
    if (!localActiveSub && subscriptions.length > 0) {
      setLocalActiveSub(subscriptions[0].id);
    }
  }, [subscriptions, localActiveSub]);

  const currentSub = activeSub !== undefined ? activeSub : localActiveSub;

  const handleSubClick = (id: string) => {
    if (onSubChange) onSubChange(id);
    else setLocalActiveSub(id);
    navigate('/dashboard');
  };

  const activeUser = accounts[0]?.name || userName;

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  const activeSubName = subscriptions.find(s => s.id === currentSub)?.name || 'Unknown Sub';

  return (
    <div className="min-h-screen flex overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-100/50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-white/5 flex flex-col flex-shrink-0 z-30 transition-all">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">Azure Command</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold">DevOps Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 mt-4 px-3 space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-70">Subscriptions</p>
          {subscriptions.length === 0 && (
            <div className="px-4 py-2 text-xs text-slate-500 italic">No subscriptions loaded</div>
          )}
          {subscriptions.map((sub, idx) => {
            const Icon = idx === 0 ? Cloud : (idx === 1 ? Code : Layers);
            const isActive = currentSub === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubClick(sub.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-500/10 border-r-4 border-blue-500 text-blue-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 group'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : 'group-hover:text-blue-500 transition-colors'}`} />
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} text-left truncate`}>{sub.name}</span>
              </button>
            )
          })}

          <div className="pt-8 px-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-70">System</p>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 transition-all group ${
              location.pathname === '/dashboard' && !subscriptions.map(s=>s.id).includes(currentSub) ? 'bg-blue-500/10 text-blue-500' : ''
            }`}
          >
            <Activity className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm font-medium">Global Metrics</span>
          </button>
          
          <button
            onClick={() => navigate('/users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 transition-all group ${
              location.pathname === '/users' ? 'bg-blue-500/10 text-blue-500' : ''
            }`}
          >
            <Settings className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm font-medium">User Management</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 bg-slate-200/50 dark:bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-slate-300 dark:border-blue-500/15 p-3 rounded-xl cursor-pointer hover:bg-slate-300/50 dark:hover:bg-[rgba(30,41,59,0.6)] transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden ring-1 ring-slate-400/50 dark:ring-white/10 flex items-center justify-center text-slate-600 dark:text-white">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div className="overflow-hidden flex-1 text-left">
                  <p className="text-xs font-bold truncate">{activeUser}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userRole}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300 focus:bg-red-100 dark:focus:bg-red-400/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 text-sm">Subscriptions</span>
            <span className="text-slate-400 dark:text-slate-500">/</span>
            <span className="text-sm font-bold text-blue-500">{activeSubName}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>
            <button 
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-blue-500 px-4 py-2 rounded-lg text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto z-10 p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
