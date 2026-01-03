import { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardHeader, Button } from '../components/ui';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../api';
import { useToast } from '../hooks/useToast';
import type { User, UserRole, UserCreateRequest, UserUpdateRequest } from '../api/types';
import { clsx } from 'clsx';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<{ userId: number; password: string } | null>(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (userData: UserCreateRequest) => {
    try {
      await createUser(userData);
      setShowCreateModal(false);
      showToast('success', 'User created successfully');
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      throw new Error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId: number, userData: UserUpdateRequest) => {
    try {
      await updateUser(userId, userData);
      setEditingUser(null);
      showToast('success', 'User updated successfully');
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      throw new Error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await deleteUser(userId);
      showToast('success', 'User deactivated');
      fetchUsers();
    } catch {
      showToast('error', 'Failed to deactivate user');
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;
    try {
      const response = await resetUserPassword(userId);
      setTempPassword({ userId, password: response.temporary_password });
      showToast('success', 'Password reset successfully');
    } catch {
      showToast('error', 'Failed to reset password');
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      case 'operator':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
      case 'viewer':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage users and their access permissions"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Button>
        }
      />

      {error && (
        <div
          className="mb-6 rounded-lg p-4 text-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      {tempPassword && (
        <div
          className="mb-6 rounded-lg p-4"
          style={{
            backgroundColor: 'var(--color-accent-50)',
            border: '1px solid var(--color-accent-200)',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>
                Password Reset Successful
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Temporary password: <code className="font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent-600)' }}>{tempPassword.password}</code>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Please share this securely with the user. They should change it after logging in.
              </p>
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Users"
          description={`${users.length} users total`}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: 'var(--color-accent-500)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Created</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[var(--color-page-bg)] transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {user.full_name || 'No name'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={getRoleBadgeStyle(user.role)}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium'
                        )}
                        style={{
                          backgroundColor: user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                          color: user.is_active ? '#10B981' : '#6B7280',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: 'currentColor' }}
                        />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-page-bg)]"
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" style={{ color: 'var(--color-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-page-bg)]"
                          title="Reset password"
                        >
                          <svg className="w-4 h-4" style={{ color: 'var(--color-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        {user.is_active && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg transition-colors hover:bg-red-50"
                            title="Deactivate user"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserModal
          title="Create User"
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await handleCreateUser(data as UserCreateRequest);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserModal
          title="Edit User"
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={async (data) => {
            await handleUpdateUser(editingUser.id, data as UserUpdateRequest);
          }}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  title: string;
  user?: User;
  onClose: () => void;
  onSubmit: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
}

function UserModal({ title, user, onClose, onSubmit }: UserModalProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'viewer');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await onSubmit({
          full_name: fullName || undefined,
          role,
          is_active: isActive,
        } as UserUpdateRequest);
      } else {
        await onSubmit({
          email,
          password,
          full_name: fullName || undefined,
          role,
        } as UserCreateRequest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-in-up"
        style={{
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-page-bg)]"
          >
            <svg className="w-5 h-5" style={{ color: 'var(--color-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter password"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input select-accent"
            >
              <option value="viewer">Viewer - Read-only access</option>
              <option value="operator">Operator - Can acknowledge alerts</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded checkbox-accent"
              />
              <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                Account is active
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
