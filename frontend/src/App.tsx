import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
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

const ADMIN_ROLES = ['super_admin', 'admin', 'franchise_owner'];
const SUPER_ROLES = ['super_admin', 'admin'];

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
  group?: string;
}

const NAV_LINKS: NavItem[] = [
  // Operations
  { to: '/',         label: 'Dashboard',   icon: '⬛', group: 'ops' },
  { to: '/parcels',  label: 'Parcels',     icon: '📦', group: 'ops' },
  { to: '/create',   label: 'New Shipment',icon: '✚',  group: 'ops' },
  { to: '/scan',     label: 'Scan',        icon: '🔲', group: 'ops' },
  { to: '/manifests',label: 'Manifests',   icon: '📋', group: 'ops' },
  { to: '/tracking', label: 'Track Parcel',icon: '📍', group: 'ops' },
  { to: '/pricing',  label: 'Pricing',     icon: '💵', group: 'ops' },
  { to: '/handover', label: 'Handover',    icon: '🤝', group: 'ops' },
  // People
  { to: '/customers',label: 'Customers',   icon: '👤', group: 'people' },
  { to: '/users',    label: 'Users',       icon: '🔑', group: 'people', roles: SUPER_ROLES },
  // Logistics
  { to: '/vehicles', label: 'Fleet',       icon: '🚚', group: 'logistics' },
  { to: '/routes',   label: 'Routes',      icon: '🗺️', group: 'logistics' },
  // Business
  { to: '/reports',  label: 'Reports',     icon: '📊', group: 'biz', roles: ADMIN_ROLES },
  { to: '/franchise',label: 'Franchise',   icon: '🏢', group: 'biz', roles: ADMIN_ROLES },
];

const GROUP_LABELS: Record<string, string> = {
  ops: 'Operations', people: 'People', logistics: 'Logistics', biz: 'Business',
};

function MobileNavLink({ to, icon, label }: NavItem) {
  const location = useLocation();
  const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return (
    <Link to={to} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center ${active ? 'text-brand-600' : 'text-slate-500'}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}

function NavLink({ to, label, icon }: NavItem) {
  const location = useLocation();
  const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  return (
    <Link to={to} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

function RoleGuard({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const { user, logout } = useAuth();

  const visibleLinks = NAV_LINKS.filter(l => !l.roles || (user && l.roles.includes(user.role)));

  const grouped = visibleLinks.reduce<Record<string, NavItem[]>>((acc, link) => {
    const g = link.group ?? 'ops';
    if (!acc[g]) acc[g] = [];
    acc[g].push(link);
    return acc;
  }, {});

  const groupOrder = ['ops', 'people', 'logistics', 'biz'];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-4 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600">Mufasa Express</p>
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
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600">Mufasa Express</p>
            <p className="text-sm font-bold text-slate-900">Courier Platform</p>
          </div>
          <button onClick={logout} className="text-xs text-slate-500 underline">Sign out</button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/"               element={<DashboardPage />} />
            <Route path="/parcels"        element={<ParcelsPage />} />
            <Route path="/parcels/:parcelId" element={<ParcelDetailPage />} />
            <Route path="/parcels/:parcelId/label" element={<ParcelLabelPage />} />
            <Route path="/create"         element={<CreateParcelPage />} />
            <Route path="/tracking"       element={<TrackingPage />} />
            <Route path="/scan"           element={<ScanPage />} />
            <Route path="/manifests"      element={<ManifestPage />} />
            <Route path="/customers"      element={<CustomersPage />} />
            <Route path="/vehicles"       element={<VehiclesPage />} />
            <Route path="/routes"         element={<RoutesPage />} />
            <Route path="/reports"        element={<RoleGuard roles={ADMIN_ROLES}><ReportsPage /></RoleGuard>} />
            <Route path="/users"          element={<RoleGuard roles={SUPER_ROLES}><UsersPage /></RoleGuard>} />
            <Route path="/pricing"        element={<PricingPage />} />
            <Route path="/handover"       element={<HandoverPage />} />
            <Route path="/parcels/:parcelId/custody" element={<CustodyChainPage />} />
            <Route path="/franchise"      element={<RoleGuard roles={ADMIN_ROLES}><FranchiseConsolePage /></RoleGuard>} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile bottom nav — top 5 ops links */}
        <nav className="flex border-t border-slate-200 bg-white md:hidden">
          {visibleLinks.filter(l => l.group === 'ops').slice(0, 5).map(link => (
            <MobileNavLink key={link.to} {...link} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
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
