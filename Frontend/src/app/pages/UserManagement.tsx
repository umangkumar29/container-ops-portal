import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Search, Plus, UserPlus, MoreVertical, Check } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/button';

type Role = 'Superadmin' | 'Admin' | 'Project Manager';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  scope: string;
  status: 'Active' | 'Pending';
  avatar?: string;
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'arivera@kportal.com',
    role: 'Superadmin',
    scope: 'Global',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?u=arivera',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'schen@kportal.com',
    role: 'Admin',
    scope: 'KPIT GM',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?u=schen',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    email: 'mjohnson@kportal.com',
    role: 'Project Manager',
    scope: 'DevOps Core',
    status: 'Active',
    avatar: 'https://i.pravatar.cc/150?u=mjohnson',
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    email: 'erodriguez@kportal.com',
    role: 'Admin',
    scope: 'QA Cluster',
    status: 'Pending',
  },
];

const RoleBadge = ({ role }: { role: Role }) => {
  const styles = {
    Superadmin: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
    Admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    'Project Manager': 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${styles[role]}`}>
      {role}
    </span>
  );
};

export function UserManagement() {
  const [users] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout userName="Alex Rivera" userRole="Superadmin">
      <div className="relative max-w-[1600px] mx-auto w-full">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-[#6366F1]" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Access Control
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Configure Role-Based Access Control and invite team members.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            <Button
              className="bg-[#6366F1] hover:bg-[#5558E3] text-white shadow-lg shadow-[rgba(99,102,241,0.25)] border-none font-medium transition-all duration-200 h-10 px-5 rounded-xl flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        </motion.div>

        {/* User Card Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative bg-card border border-border rounded-2xl p-6 overflow-hidden hover:border-[#6366F1]/30 transition-all duration-300"
            >
              {/* Subtle hover glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="relative flex items-start justify-between mb-6">
                 {/* Avatar */}
                 <div className="w-16 h-16 rounded-full overflow-hidden bg-accent border-2 border-background shadow-sm flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                 </div>

                 {/* Options Menu */}
                 <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                 </button>
              </div>

              {/* User Info */}
              <div className="relative mb-6">
                <h3 className="text-lg font-bold text-foreground truncate">{user.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                
                <div className="mt-4 flex items-center gap-2">
                   <RoleBadge role={user.role} />
                   
                   {user.status === 'Pending' && (
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Invitation Pending">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                     </span>
                   )}
                </div>
              </div>

              {/* Scope & Footer */}
              <div className="relative pt-4 border-t border-border flex items-center justify-between">
                <div>
                   <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Project Scope</span>
                   <span className="text-sm font-medium text-foreground">{user.scope}</span>
                </div>
                
                {user.status === 'Pending' ? (
                   <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded uppercase tracking-wider">
                     Pending
                   </span>
                ) : (
                   <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                     <Check className="w-3 h-3" /> Active
                   </span>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Empty State / Add Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: filteredUsers.length * 0.05 }}
            className="flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-border rounded-2xl p-6 cursor-pointer hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 transition-all group"
          >
             <div className="w-12 h-12 rounded-full bg-accent text-muted-foreground group-hover:bg-[#6366F1]/10 group-hover:text-[#6366F1] flex items-center justify-center transition-colors mb-4">
                <Plus className="w-6 h-6" />
             </div>
             <div className="text-center">
                <h4 className="font-bold text-foreground">Invite via Azure AD</h4>
                <p className="text-sm text-muted-foreground mt-1">Assign role to a new email</p>
             </div>
          </motion.div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
