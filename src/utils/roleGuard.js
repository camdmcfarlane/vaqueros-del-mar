// roleGuard.js
// Centralized role-permission mapping for AquaOps
// Roles: admin (Jason), consultor (Cameron), director (Eduardo), capitan (Joel, Rodolfo), vaquero (buceadores)

export const ROLES = {
  admin: 'admin',
  consultor: 'consultor',
  director: 'director',
  capitan: 'capitan',
  vaquero: 'vaquero',
};

// Route access by role
const ROUTE_ACCESS = {
  '/dashboard': [ROLES.admin, ROLES.consultor, ROLES.director],
  '/sistemas': [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan, ROLES.vaquero],
  '/mapa': [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan],
  '/usuarios': [ROLES.admin, ROLES.consultor, ROLES.director],
  '/configuracion': [ROLES.admin, ROLES.consultor],
  '/perfil': [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan, ROLES.vaquero],
  '/vigilancia': [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan, ROLES.vaquero],
};

// Default landing page per role after login
export const DEFAULT_ROUTE = {
  [ROLES.admin]: '/dashboard',
  [ROLES.consultor]: '/dashboard',
  [ROLES.director]: '/dashboard',
  [ROLES.capitan]: '/sistemas',
  [ROLES.vaquero]: '/vigilancia',
};

// Permission checks
export const PERMISSIONS = {
  canEditReadings: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canDeleteSystems: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canDeleteReadings: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canCreateSystems: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canAssignTasks: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan].includes(role),
  canViewDashboard: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canViewAllSystems: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director].includes(role),
  canPostAnnouncements: (role) =>
    [ROLES.admin, ROLES.consultor, ROLES.director, ROLES.capitan].includes(role),
};

// Check if a role can access a given route
export function canAccessRoute(role, path) {
  // Strip trailing slash
  const normalizedPath = path.replace(/\/$/, '') || '/';
  
  // Check exact match first
  if (ROUTE_ACCESS[normalizedPath]) {
    return ROUTE_ACCESS[normalizedPath].includes(role);
  }
  
  // Check prefix match for nested routes (e.g., /sistemas/P1)
  const parentPath = '/' + normalizedPath.split('/').filter(Boolean)[0];
  if (ROUTE_ACCESS[parentPath]) {
    return ROUTE_ACCESS[parentPath].includes(role);
  }
  
  return false;
}

// Get redirect path if user tries to access forbidden route
export function getRedirectForRole(role) {
  return DEFAULT_ROUTE[role] || '/perfil';
}
