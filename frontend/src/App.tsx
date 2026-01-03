import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout';
import { Dashboard, Systems, SystemDetail, Alerts, Disks, Pools, Replication, Trending, Settings, Help, Login, Users, Profile } from './pages';
import { ProtectedRoute } from './components/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/systems/:systemId" element={<SystemDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/disks" element={<Disks />} />
          <Route path="/pools" element={<Pools />} />
          <Route path="/replication" element={<Replication />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<Profile />} />
          {/* Admin-only route */}
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
        </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
