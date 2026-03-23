import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function AdminLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const linkClasses = ({ isActive }) =>
    `inline-flex md:block px-3 md:px-4 py-2 rounded-lg text-sm md:text-base transition-colors ${
      isActive ? "bg-slate-800 text-cyan-300 font-semibold" : "text-slate-300 hover:bg-slate-800/60"
    }`;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:p-4 flex flex-col gap-2 md:gap-0">
        <Link to="/" className="text-lg md:text-xl font-bold text-white mb-0 md:mb-8 px-2 md:px-4 whitespace-nowrap">
          Stock Manager
        </Link>

        <nav className="flex flex-wrap md:flex-col gap-2 md:gap-1 md:flex-1">
          <NavLink to="/admin/products" className={linkClasses}>
            Products
          </NavLink>
          <NavLink to="/admin/barcode" className={linkClasses}>
            Scanner
          </NavLink>
          <NavLink to="/admin/profile" className={linkClasses}>
            Profile
          </NavLink>
          <button
            onClick={handleLogout}
            className="md:hidden inline-flex px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-slate-800/60"
          >
            Log out
          </button>
        </nav>

        <div className="hidden md:block border-t pt-4 px-4">
          <p className="text-sm text-slate-400 mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="text-sm text-rose-400 hover:text-rose-300">
            Log out
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-slate-900 p-4 md:p-8 text-slate-100 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
