import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function AdminLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const linkClasses = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <Link to="/" className="text-xl font-bold text-gray-900 mb-8 px-4">
          Retail Catalog
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/admin/products" className={linkClasses}>
            Productos
          </NavLink>
          <NavLink to="/admin/barcode" className={linkClasses}>
            Escaner
          </NavLink>
          <NavLink to="/admin/profile" className={linkClasses}>
            Perfil
          </NavLink>
        </nav>

        <div className="border-t pt-4 px-4">
          <p className="text-sm text-gray-500 mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
