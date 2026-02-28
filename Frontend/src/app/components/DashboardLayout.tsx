import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Box, 
  LayoutDashboard, 
  Users, 
  Bell, 
  UserCircle, 
  ChevronDown 
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
  userName?: string;
}

export function DashboardLayout({ children, userRole = 'Superadmin', userName = 'Alex Rivera' }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'User Management', icon: Users, path: '/users' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-background text-foreground font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-20 hover:w-64 flex-shrink-0 bg-card border-r border-border flex flex-col group overflow-hidden z-30 transition-[width] duration-300 cubic-bezier(0.4, 0, 0.2, 1)">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-[#6366F1]/20">
            <Box className="w-5 h-5" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-lg font-bold leading-none">KPortal</h1>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Control Center</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || 
              (link.path.startsWith('/analytics') && location.pathname.startsWith('/analytics'));
            
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#6366F1]/10 text-[#6366F1] font-medium' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm opacity-0 group-hover:opacity-100 whitespace-nowrap">{link.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
             <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-foreground">
                <UserCircle className="w-6 h-6" />
             </div>
             <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <span className="text-[10px] text-[#6366F1] uppercase font-bold tracking-wider">{userRole}</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background gradient effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-300 z-0">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-[#6366F1] rounded-full blur-[140px] opacity-[0.08]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6] rounded-full blur-[140px] opacity-[0.05]" />
        </div>

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl border-b border-border z-20">
          <div className="flex-1 flex items-center gap-8">
            <div className="flex items-center bg-card/50 p-1 rounded-xl border border-border">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname === '/dashboard' ? 'bg-[#6366F1]/20 text-[#6366F1]' : 'text-muted-foreground hover:text-foreground'
                }`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Environments
                </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-accent text-muted-foreground transition-all">
              <Bell className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>

            <div className="h-8 w-px bg-border mx-2"></div>
            
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-border bg-card/30 hover:bg-accent/50 cursor-pointer transition-colors">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{userName}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto z-10 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
