import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TrackingPage } from './pages/TrackingPage';
import { CreateParcelPage } from './pages/CreateParcelPage';
import { ParcelsPage } from './pages/ParcelsPage';
import { ParcelDetailPage } from './pages/ParcelDetailPage';
import { ScanPage } from './pages/ScanPage';
import { FranchiseConsolePage } from './pages/FranchiseConsolePage';
import { ManifestPage } from './pages/ManifestPage';
import { CustomersPage } from './pages/CustomersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { RoutesPage } from './pages/RoutesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { PricingPage } from './pages/PricingPage';
import { ParcelLabelPage } from './pages/ParcelLabelPage';
import { HandoverPage } from './pages/HandoverPage';
import { CustodyChainPage } from './pages/CustodyChainPage';

// ── Role definitions ──────────────────────────────────────────────────────────
// Courier-industry access model:
//   super_admin     — full system, all settings, all data
//   admin           — operations manager, everything except system config
//   franchise_owner — territory owner, own branches/reports, no user admin
//   branch_manager  — branch ops, no user management or finances
//   shop_assistant  — intake/counter staff, create parcels & customers, scan
//   driver          — field only: scan, handover, view own assigned parcels
//   clerk           — admin support: parcels, customers, scan, manifests
//   accountant      — finance view: reports & pricing only
//   logistics_manager — routes, fleet, manifests, parcels view

const R = {
  SUPER:       ['super_admin'],
  ADMIN_UP:    ['super_admin', 'admin'],
  MANAGER_UP:  ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager'],
  OFFICE:      ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager', 'clerk', 'shop_assistant'],
  NO_DRIVER:   ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager', 'clerk', 'shop_assistant', 'accountant'],
  FIELD:       ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager', 'clerk', 'shop_assistant', 'driver'],
  ALL:         ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager', 'clerk', 'shop_assistant', 'driver', 'accountant'],
  FINANCE:     ['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'accountant'],
  FLEET_ACCESS:['super_admin', 'admin', 'franchise_owner', 'branch_manager', 'logistics_manager', 'driver'],
};

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
  group?: string;
}

const NAV_LINKS: NavItem[] = [
  // Operations
  { to: '/dashboard', label: 'Dashboard',    icon: '⬛', group: 'ops',       roles: R.ALL },
  { to: '/parcels',   label: 'Parcels',      icon: '📦', group: 'ops',       roles: R.ALL },
  { to: '/create',    label: 'New Shipment', icon: '✚',  group: 'ops',       roles: R.NO_DRIVER },
  { to: '/scan',      label: 'Scan',         icon: '🔲', group: 'ops',       roles: R.FIELD },
  { to: '/handover',  label: 'Handover',     icon: '🤝', group: 'ops',       roles: R.FIELD },
  { to: '/manifests', label: 'Manifests',    icon: '📋', group: 'ops',       roles: [...R.OFFICE, 'driver'] },
  { to: '/tracking',  label: 'Track Parcel', icon: '📍', group: 'ops',       roles: R.ALL },
  // People
  { to: '/customers', label: 'Customers',    icon: '👤', group: 'people',    roles: R.OFFICE },
  { to: '/users',     label: 'Users',        icon: '🔑', group: 'people',    roles: R.ADMIN_UP },
  // Logistics
  { to: '/vehicles',  label: 'Fleet',        icon: '🚚', group: 'logistics', roles: R.FLEET_ACCESS },
  { to: '/routes',    label: 'Routes',       icon: '🗺️', group: 'logistics', roles: R.MANAGER_UP },
  // Business
  { to: '/pricing',   label: 'Pricing',      icon: '💵', group: 'biz',       roles: R.FINANCE },
  { to: '/reports',   label: 'Reports',      icon: '📊', group: 'biz',       roles: R.FINANCE },
  { to: '/franchise', label: 'Franchise',    icon: '🏢', group: 'biz',       roles: ['super_admin', 'admin', 'franchise_owner'] },
];

const GROUP_LABELS: Record<string, string> = {
  ops: 'Operations', people: 'People', logistics: 'Logistics', biz: 'Business',
};

const PINNED_MOBILE = ['/dashboard', '/parcels', '/create', '/scan'];

function isActive(to: string, pathname: string) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(to);
}

function MobileNavLink({ to, icon, label, onClick }: NavItem & { onClick?: () => void }) {
  const location = useLocation();
  const active = isActive(to, location.pathname);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center ${active ? 'text-brand-500' : 'text-slate-500'}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] leading-tight">{label}</span>
    </Link>
  );
}

function NavLink({ to, label, icon }: NavItem) {
  const location = useLocation();
  const active = isActive(to, location.pathname);
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

function RoleGuard({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(l => !l.roles || (user && l.roles.includes(user.role as string)));

  const grouped = visibleLinks.reduce<Record<string, NavItem[]>>((acc, link) => {
    const g = link.group ?? 'ops';
    if (!acc[g]) acc[g] = [];
    acc[g].push(link);
    return acc;
  }, {});

  const groupOrder = ['ops', 'people', 'logistics', 'biz'];
  const pinnedLinks = visibleLinks.filter(l => PINNED_MOBILE.includes(l.to));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-4 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600">Starverse Express</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">Courier Platform</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {groupOrder.map(g => {
            const links = grouped[g];
            if (!links?.length) return null;
            return (
              <div key={g}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{GROUP_LABELS[g]}</p>
                <div className="space-y-0.5">
                  {links.map(link => <NavLink key={link.to} {...link} />)}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 leading-none">Starverse Express</p>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-500 capitalize leading-none">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Sign out
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-6 lg:px-8">
          <Routes>
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/parcels"    element={<ParcelsPage />} />
            <Route path="/parcels/:parcelId" element={<ParcelDetailPage />} />
            <Route path="/parcels/:parcelId/label" element={<ParcelLabelPage />} />
            <Route path="/parcels/:parcelId/custody" element={<CustodyChainPage />} />
            <Route path="/tracking"   element={<TrackingPage />} />
            <Route path="/create"     element={<RoleGuard roles={R.NO_DRIVER}><CreateParcelPage /></RoleGuard>} />
            <Route path="/scan"       element={<RoleGuard roles={R.FIELD}><ScanPage /></RoleGuard>} />
            <Route path="/handover"   element={<RoleGuard roles={R.FIELD}><HandoverPage /></RoleGuard>} />
            <Route path="/manifests"  element={<ManifestPage />} />
            <Route path="/customers"  element={<RoleGuard roles={R.OFFICE}><CustomersPage /></RoleGuard>} />
            <Route path="/vehicles"   element={<RoleGuard roles={R.FLEET_ACCESS}><VehiclesPage /></RoleGuard>} />
            <Route path="/routes"     element={<RoleGuard roles={R.MANAGER_UP}><RoutesPage /></RoleGuard>} />
            <Route path="/pricing"    element={<RoleGuard roles={R.FINANCE}><PricingPage /></RoleGuard>} />
            <Route path="/reports"    element={<RoleGuard roles={R.FINANCE}><ReportsPage /></RoleGuard>} />
            <Route path="/users"      element={<RoleGuard roles={R.ADMIN_UP}><UsersPage /></RoleGuard>} />
            <Route path="/franchise"  element={<RoleGuard roles={['super_admin','admin','franchise_owner']}><FranchiseConsolePage /></RoleGuard>} />
            <Route path="*"           element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white md:hidden">
          {pinnedLinks.map(link => (
            <MobileNavLink key={link.to} {...link} onClick={() => setMoreOpen(false)} />
          ))}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center transition-colors ${moreOpen ? 'text-brand-500' : 'text-slate-500'}`}
          >
            <span className="text-lg">{moreOpen ? '✕' : '☰'}</span>
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </nav>

        {/* More overlay */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-14 left-0 right-0 z-40 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-3 pb-4 shadow-2xl md:hidden">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
              {groupOrder.map(g => {
                const links = grouped[g];
                if (!links?.length) return null;
                return (
                  <div key={g} className="mb-4">
                    <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {GROUP_LABELS[g]}
                    </p>
                    <div className="space-y-0.5">
                      {links.map(link => {
                        const active = isActive(link.to, location.pathname);
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMoreOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span className="text-base">{link.icon}</span>
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

// Public root: landing page for guests, redirect to dashboard for authenticated users
function PublicRoot() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<PublicRoot />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*"     element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
