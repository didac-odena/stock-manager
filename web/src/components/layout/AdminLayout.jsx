import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function AdminLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const linkClasses = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive ? "bg-slate-800 text-cyan-300 font-semibold" : "text-slate-300 hover:bg-slate-800/60"
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col">
        <Link to="/" className="text-xl font-bold text-white mb-8 px-4">
          Stock Manager
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/admin/products" className={linkClasses}>
            Products
          </NavLink>
          <NavLink to="/admin/barcode" className={linkClasses}>
            Scanner
          </NavLink>
          <NavLink to="/admin/profile" className={linkClasses}>
            Profile
          </NavLink>
        </nav>

        <div className="border-t pt-4 px-4">
          <p className="text-sm text-slate-400 mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="text-sm text-rose-400 hover:text-rose-300">
            Log out
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-slate-900 p-8 text-slate-100">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
