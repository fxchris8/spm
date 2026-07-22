import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export function SsoCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const completeSsoLogin = async () => {
      const ssoError = searchParams.get('sso_error');

      if (ssoError) {
        toast.error(ssoError);
        navigate('/login', { replace: true });
        return;
      }

      const user = await refreshSession();

      if (user) {
        toast.success('Login SSO berhasil');
        navigate('/', { replace: true });
        return;
      }

      toast.error('Sesi SSO tidak ditemukan');
      navigate('/login', { replace: true });
    };

    completeSsoLogin();
  }, [navigate, refreshSession, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white px-6 py-5 shadow">
        <p className="text-sm font-medium text-gray-700">
          Menyelesaikan login SSO...
        </p>
      </div>
    </div>
  );
}
