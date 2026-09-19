import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Truck,
  FolderTree,
  Users,
  LogOut,
  FileSpreadsheet,
  Ruler,
  ClipboardList,
  PackageMinus
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacien', 'assistant'] },
    { label: 'Caisse / Ventes', path: '/ventes', icon: ShoppingCart, roles: ['admin', 'pharmacien', 'assistant'] },
    { label: 'Rapports Ventes', path: '/rapports-ventes', icon: FileSpreadsheet, roles: ['admin'] },
    { label: 'Médicaments', path: '/products', icon: Pill, roles: ['admin', 'pharmacien'] },
    { label: 'Approvisionnements', path: '/approvisionnements', icon: Truck, roles: ['admin', 'pharmacien'] },
    { label: 'Sorties Internes', path: '/sorties', icon: PackageMinus, roles: ['admin', 'pharmacien'] },
    { label: 'Inventaire', path: '/inventaires', icon: ClipboardList, roles: ['admin'] },
    { label: 'Catégories', path: '/categories', icon: FolderTree, roles: ['admin', 'pharmacien'] },
    { label: 'Fournisseurs', path: '/fournisseurs', icon: Users, roles: ['admin', 'pharmacien'] },
    { label: 'Unités', path: '/unites', icon: Ruler, roles: ['admin', 'pharmacien'] },
  ];

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    pharmacien: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    assistant: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 sticky top-0 h-screen shadow-sm">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-600/20">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 tracking-tight leading-none text-lg">3 Samaritaines</h1>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gestion Officine</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isAllowed = item.roles.includes(user?.role);
              const isActive = location.pathname === item.path;

              if (!isAllowed) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${isActive
                      ? 'bg-teal-50 text-teal-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Utilisateur'}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 capitalize ${roleColors[user?.role] || 'bg-slate-100'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}