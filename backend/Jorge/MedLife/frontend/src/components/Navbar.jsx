import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../constants/roles';
import {
  IconCalendar,
  IconClipboard,
  IconLogout,
  IconStaff,
  IconUsers,
  LogoMark,
} from './Icons';

const NAV_ITEMS = [
  { to: '/patients', label: 'Pacientes', Icon: IconUsers },
  { to: '/appointments', label: 'Citas', Icon: IconCalendar },
  { to: '/diagnoses', label: 'Diagnósticos', Icon: IconClipboard },
];

const ADMIN_NAV_ITEMS = [
  { to: '/users', label: 'Usuarios', Icon: IconStaff },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <LogoMark size={36} />
        <div>
          <span>MedLife</span>
          <div className="navbar__tagline">Gestión clínica</div>
        </div>
      </div>

      <div className="navbar__links">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
        {isAdmin &&
          ADMIN_NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link nav-link--admin${isActive ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
      </div>

      <div className="navbar__actions">
        {user && (
          <div className="navbar__user-badge">
            <span className="navbar__user-role">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        )}
        <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
          <IconLogout />
          Salir
        </button>
      </div>
    </nav>
  );
}
