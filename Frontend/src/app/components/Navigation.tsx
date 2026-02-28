import { Box, UserCircle, LayoutDashboard, BarChart2, Settings, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  userRole?: string;
}

export function Navigation({ userRole = 'Administrator' }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Environments', icon: LayoutDashboard, path: '/' },
    { label: 'Analytics', icon: BarChart2, path: '/analytics/1' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(99,102,241,0.04)] via-transparent to-[rgba(139,92,246,0.04)] pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#6366F1] blur-lg opacity-40" />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[rgba(99,102,241,0.3)]">
                <Box className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-foreground tracking-tight leading-tight">
                KPortal
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight tracking-widest uppercase">
                Control Center
              </p>
            </div>
          </motion.div>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                (link.path.startsWith('/analytics') && location.pathname.startsWith('/analytics'));
              return (
                <motion.button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-[rgba(99,102,241,0.1)] text-[#6366F1] border border-[rgba(99,102,241,0.2)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </motion.button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border hover:border-[rgba(99,102,241,0.4)] hover:bg-accent transition-all duration-200 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6366F1] border-2 border-background" />
            </motion.button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Badge */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-accent hover:border-[rgba(99,102,241,0.3)] transition-all duration-200 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <UserCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">{userRole}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
