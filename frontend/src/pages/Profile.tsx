import { useState } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { changePassword } from '../api';

export function Profile() {
  const { user, mustChangePassword, onPasswordChanged } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      onPasswordChanged(); // Clear the must change password flag
      showToast('success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      case 'operator':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
      case 'viewer':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
      default:
        return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    }
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account settings"
      />

      {mustChangePassword && (
        <div
          className="mb-6 rounded-lg p-4 max-w-4xl"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#F59E0B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium" style={{ color: '#F59E0B' }}>
                Password Change Required
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                You are using a default or temporary password. Please change your password to continue.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Account Info */}
        <Card>
          <CardHeader
            title="Account Information"
            description="Your account details"
          />
          <div className="p-5 pt-0 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Email
              </label>
              <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                {user?.email}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Name
              </label>
              <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                {user?.full_name || 'Not set'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Role
              </label>
              <span
                className="inline-block px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={getRoleBadgeStyle(user?.role || '')}
              >
                {user?.role}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                Account Created
              </label>
              <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader
            title="Change Password"
            description="Update your password"
          />
          <div className="p-5 pt-0">
            {error && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Confirm new password"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
