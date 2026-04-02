import { NavLink, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

type ProtectedNavProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/overview', label: 'All Tasks' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/competitions', label: 'Competitions' },
];

export default function ProtectedNav({ isDarkMode, onToggleTheme }: ProtectedNavProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedServerId');
      navigate('/login');
    }
  };

  return (
    <header className="protected-nav">
      <div className="protected-nav__brand">
        <span className="brand-mark">V</span>
        <div>
          <p className="brand-name">Vie</p>
          <p className="brand-tag">Tasks, streaks, competition.</p>
        </div>
      </div>

      <nav className="protected-nav__links" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-chip ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="protected-nav__actions">
        <button
          type="button"
          className="theme-icon-btn"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀' : '☾'}
        </button>
        <button type="button" className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
