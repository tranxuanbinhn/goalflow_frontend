import { NavLink } from 'react-router-dom';
import { Home, Target, CheckCircle, ListTodo, BarChart3, Settings, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react';
import { useSidebarStore } from '../../store/sidebarStore';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/habits', icon: CheckCircle, label: 'Habits' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/scratch', icon: StickyNote, label: 'Scratchpad' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebarStore();

  return (
    <aside 
      className={`
        sidebar fixed left-0 top-0 h-screen 
        flex flex-col items-center py-6 
        bg-background-secondary border-r border-glass-border z-30
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-56' : 'w-[72px]'}
      `}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between w-full px-4 mb-8">
        <div 
          className={`
            w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
            flex items-center justify-center transition-all duration-300
            ${isExpanded ? 'mr-3' : ''}
          `}
        >
          <span className="text-white font-bold text-lg">G</span>
        </div>
        
        {/* Label - Only visible when expanded */}
        <span 
          className={`
            font-heading font-bold text-xl text-text-primary whitespace-nowrap overflow-hidden
            transition-all duration-300
            ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}
          `}
        >
          GoalFlow
        </span>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`
          absolute -right-3 top-8 w-6 h-6 
          bg-background-secondary border border-glass-border 
          rounded-full flex items-center justify-center
          text-text-muted hover:text-text-primary
          transition-all duration-200 hover:scale-110
          z-40
          ${isExpanded ? 'rotate-0' : 'rotate-180'}
        `}
        title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `
                group relative flex items-center gap-3 px-3 py-3 rounded-xl 
                transition-all duration-200
                ${isActive
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'text-text-muted hover:text-text-primary hover:bg-black/[0.05] dark:hover:bg-white/5'
                }
              `
            }
          >
            <Icon size={22} className="flex-shrink-0" />
            
            {/* Label - Only visible when expanded */}
            <span 
              className={`
                whitespace-nowrap overflow-hidden transition-all duration-300
                ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}
              `}
            >
              {label}
            </span>
            
            {/* Tooltip - Only visible when collapsed */}
            {!isExpanded && (
              <div className="
                absolute left-full ml-2 px-2 py-1 
                bg-background-card border border-glass-border 
                rounded-lg text-sm text-text-primary
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 whitespace-nowrap
                pointer-events-none z-50
                shadow-lg
              ">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User avatar (bottom) */}
      <div className="mt-auto">
        <div 
          className={`
            flex items-center gap-3 px-3 py-2 rounded-xl
            bg-black/[0.05] dark:bg-white/5
            transition-all duration-300
            ${isExpanded ? 'w-40' : 'w-10'}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            U
          </div>
          <span 
            className={`
              text-sm font-medium text-text-primary whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}
            `}
          >
            User
          </span>
        </div>
      </div>
    </aside>
  );
}
