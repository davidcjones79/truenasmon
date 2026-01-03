import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../api/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-page-bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2"
            style={{ borderColor: 'var(--color-accent-500)' }}
          />
          <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change - redirect to profile if not already there
  if (mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  // Check role-based access if roles are specified
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-page-bg)' }}
      >
        <div
          className="max-w-md text-center p-8 rounded-2xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: '#EF4444' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--color-foreground)' }}
          >
            Access Denied
          </h2>
          <p style={{ color: 'var(--color-muted)' }}>
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent-500)',
              color: 'white',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
