import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function Navbar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="bg-slate-950 text-slate-100 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-white">
            Stock Manager
          </Link>

          <div className="flex gap-4 items-center">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "text-cyan-300 font-semibold" : "text-slate-300 hover:text-white"
              }
            >
              Catalog
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    isActive ? "text-cyan-300 font-semibold" : "text-slate-300 hover:text-white"
                  }
                >
                  Admin
                </NavLink>
                <span className="text-slate-400 text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-rose-400 hover:text-rose-300 text-sm"
                >
                  Log out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "text-cyan-300 font-semibold" : "text-slate-300 hover:text-white"
                }
              >
                Log in
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
