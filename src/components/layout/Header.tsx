import { Search, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="header fixed top-0 left-[72px] right-0 h-16 bg-background-secondary/80 backdrop-blur-xl border-b border-glass-border flex items-center justify-between px-6 z-20">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search goals, tasks..."
            className="w-full pl-10 pr-4 py-2 bg-black/[0.05] dark:bg-white/5 border border-glass-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-black/[0.05] dark:hover:bg-white/5 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-pink rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted">{user?.email || 'user@example.com'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-medium">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
