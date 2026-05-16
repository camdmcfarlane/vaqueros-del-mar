// ProtectedRoute.jsx
// Wrap any tab content to enforce role-based access
// Usage: <ProtectedRoute path="/sistemas"><SistemasTab /></ProtectedRoute>

import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute } from '../utils/roleGuard';

export default function ProtectedRoute({ children, path }) {
  const { user, profile } = useAuth();

  if (!user) return null;

  const role = profile?.role || user?.role || 'vaquero';

  if (!canAccessRoute(role, path || '/')) return null;

  return children;
}
