import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Retail Catalog
          </Link>

          <div className="flex gap-4">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              Catalog
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/admin/profile"
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }
                >
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
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
