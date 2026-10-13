import { useAuth } from '../auth/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="user-menu">
      <span title={user.email}>{user.name}</span>
      <button className="link small" type="button" onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  );
}
