import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { apiClient } from '@/services/apiClient';
import { LoadingPage } from '@/components/ui';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenFromOAuth, setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const expiresAt = searchParams.get('expiresAt');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    if (token && expiresAt) {
      // Set token first
      setTokenFromOAuth(token, expiresAt);

      // Then fetch user profile
      apiClient
        .get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data.data);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          navigate('/dashboard', { replace: true });
        });
    } else {
      navigate('/login?error=missing_token', { replace: true });
    }
  }, [searchParams, navigate, setTokenFromOAuth, setUser]);

  return <LoadingPage message="Signing you in..." />;
}
