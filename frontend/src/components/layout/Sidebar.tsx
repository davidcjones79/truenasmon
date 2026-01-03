import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

function NavItem({ to, icon, label, badge, collapsed }: NavItemProps) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
          collapsed ? 'justify-center' : '',
          !isActive && (isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
        )
      }
      style={({ isActive }) => isActive ? {
        background: 'var(--gradient-accent)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
      } : {}}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
          }}
        />
      )}
    </NavLink>
  );
}

// Simple SVG icons
const icons = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  systems: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  alerts: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  disks: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="4" y1="8" x2="8" y2="8" />
    </svg>
  ),
  pools: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  replication: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  trending: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  help: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  logout: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  collapse: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  expand: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  sun: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  moon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

interface SidebarProps {
  alertCount?: number;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ alertCount = 0, collapsed, onToggle }: SidebarProps) {
  const { mode, toggleMode } = useTheme();
  const { user, logout, canManageUsers } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDark = mode === 'dark';

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      case 'operator':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
      default:
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
    }
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 bottom-0 flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Logo */}
      <div
        className={clsx(collapsed ? 'p-4' : 'p-6')}
        style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
      >
        <div className={clsx('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--gradient-accent)',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <h1
                className="text-lg font-bold tracking-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TrueNAS Mon
              </h1>
              <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Fleet Monitor</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={clsx('flex-1 space-y-1', collapsed ? 'p-2' : 'p-4')}>
        <NavItem to="/" icon={icons.dashboard} label="Dashboard" collapsed={collapsed} />
        <NavItem to="/systems" icon={icons.systems} label="Systems" collapsed={collapsed} />
        <NavItem to="/alerts" icon={icons.alerts} label="Alerts" badge={alertCount} collapsed={collapsed} />
        <NavItem to="/disks" icon={icons.disks} label="Disks" collapsed={collapsed} />
        <NavItem to="/pools" icon={icons.pools} label="Pools" collapsed={collapsed} />
        <NavItem to="/replication" icon={icons.replication} label="Replication" collapsed={collapsed} />
        <NavItem to="/trending" icon={icons.trending} label="Trending" collapsed={collapsed} />
        {canManageUsers && (
          <NavItem to="/users" icon={icons.users} label="Users" collapsed={collapsed} />
        )}
      </nav>

      {/* Bottom section */}
      <div
        className={clsx(collapsed ? 'p-2' : 'p-4')}
        style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
      >
        {/* Theme mode toggle */}
        <button
          onClick={toggleMode}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full mb-2',
            collapsed ? 'justify-center' : '',
            isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {isDark ? icons.sun : icons.moon}
          </span>
          {!collapsed && <span className="flex-1 text-left">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <NavItem to="/settings" icon={icons.settings} label="Settings" collapsed={collapsed} />
        <NavItem to="/help" icon={icons.help} label="Help" collapsed={collapsed} />

        {/* User section */}
        {user && (
          <div className="relative mt-3">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
                collapsed ? 'justify-center' : '',
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
              title={collapsed ? `${user.full_name || user.email} (${user.role})` : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {icons.user}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{user.full_name || user.email.split('@')[0]}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                    style={getRoleBadgeStyle(user.role)}
                  >
                    {user.role}
                  </span>
                </>
              )}
            </button>

            {/* User dropdown menu */}
            {showUserMenu && !collapsed && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
                >
                  <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {user.full_name || 'No name set'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {user.email}
                  </p>
                </div>
                <NavLink
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 text-sm w-full transition-colors',
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  )}
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {icons.settings}
                  <span>Profile & Settings</span>
                </NavLink>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 text-sm w-full transition-colors',
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                  )}
                  style={{ color: '#EF4444' }}
                >
                  {icons.logout}
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {/* Collapsed logout button */}
            {collapsed && (
              <button
                onClick={logout}
                className={clsx(
                  'flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full mt-2',
                  isDark
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                    : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                )}
                title="Sign out"
              >
                {icons.logout}
              </button>
            )}
          </div>
        )}

        {!collapsed && (
          <div className="mt-4 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            <p className="font-medium">v0.1.0</p>
            <p className="opacity-70">Built for MSPs</p>
          </div>
        )}
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        className={clsx(
          'absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
          isDark
            ? 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        )}
        style={{
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? icons.expand : icons.collapse}
      </button>
    </aside>
  );
}
