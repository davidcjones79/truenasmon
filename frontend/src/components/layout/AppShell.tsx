import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAlertCount } from '../../hooks/useAlerts';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function AppShell() {
  const { count: alertCount } = useAlertCount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Sidebar
        alertCount={alertCount}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '15rem' }}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
