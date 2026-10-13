import App from '../App';
import { AuthScreen } from '../components/AuthScreen';
import { useAuth } from './useAuth';

export function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        Cargando sesión...
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <App key={user.id} />;
}
