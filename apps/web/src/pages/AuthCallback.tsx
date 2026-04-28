import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { LoadingPage } from '@/components/ui';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenFromOAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const expiresAt = searchParams.get('expiresAt');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    if (token && expiresAt) {
      setTokenFromOAuth(token, expiresAt);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login?error=missing_token', { replace: true });
    }
  }, [searchParams, navigate, setTokenFromOAuth]);

  return <LoadingPage message="Signing you in..." />;
}
