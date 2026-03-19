import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function Navbar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Retail Catalog
          </Link>

          <div className="flex gap-4 items-center">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
              }
            >
              Catalogo
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                  }
                >
                  Admin
                </NavLink>
                <span className="text-gray-500 text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;