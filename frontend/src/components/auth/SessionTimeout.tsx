import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Show warning 5 minutes before

export function SessionTimeout() {
  const { isAuthenticated, logout, refreshUser } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!isAuthenticated) return;

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.floor(WARNING_BEFORE_MS / 1000));

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [isAuthenticated, logout]);

  const handleStayLoggedIn = useCallback(async () => {
    setShowWarning(false);
    resetTimers();
    // Refresh user to extend server session
    try {
      await refreshUser();
    } catch {
      // Token expired, will redirect to login
    }
  }, [resetTimers, refreshUser]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      // Only reset if warning isn't showing
      if (!showWarning) {
        resetTimers();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, showWarning, resetTimers]);

  if (!isAuthenticated || !showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 animate-fade-in-up text-center"
        style={{
          backgroundColor: 'var(--color-surface)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Timer icon */}
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: '#F59E0B' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--color-foreground)' }}
        >
          Session Timeout Warning
        </h2>

        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          Your session will expire due to inactivity.
        </p>

        {/* Countdown */}
        <div
          className="text-3xl font-mono font-bold mb-6"
          style={{ color: remainingSeconds < 60 ? '#EF4444' : '#F59E0B' }}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        <div className="flex gap-3">
          <button
            onClick={logout}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-page-bg)',
              color: 'var(--color-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            Sign Out
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{
              background: 'var(--gradient-accent)',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            }}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
