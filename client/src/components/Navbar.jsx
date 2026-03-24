import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        Stat<span>Blitz</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/players" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Players
        </NavLink>
        <NavLink to="/watchlists" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Watchlists
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-divider" />
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Admin
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span className="navbar-username">{user?.username}</span>
        {user?.role === 'admin' && (
          <span className="navbar-role-badge">admin</span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
