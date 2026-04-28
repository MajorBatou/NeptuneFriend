import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Input, Button } from '@/components/ui';
import styles from './Login.module.css';

type Mode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loginAsync, registerAsync, isLoggingIn, isRegistering } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  // Check for OAuth errors in URL
  const urlError = new URLSearchParams(location.search).get('error');

  const isLoading = isLoggingIn || isRegistering;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await loginAsync({ email, password });
      } else {
        await registerAsync({ name, email, password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    }
  }

  function handleGoogleLogin() {
    // In development use API directly, in production use relative /api path
    const apiUrl = import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin;
    window.location.href = `${apiUrl}/auth/google`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.anchor} aria-hidden="true">
            ⚓
          </span>
          <h1 className={styles.brandName}>NeptuneFriend</h1>
          <p className={styles.brandSub}>Real-time sailing conditions for mariners</p>
        </div>

        {/* Google OAuth button */}
        <button className={styles.googleBtn} onClick={handleGoogleLogin} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
            />
            <path
              fill="#34A853"
              d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
            />
            <path
              fill="#FBBC05"
              d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
            />
            <path
              fill="#EA4335"
              d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
            />
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        {/* Mode tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={[styles.tab, mode === 'login' ? styles.tabActive : ''].join(' ')}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            className={[styles.tab, mode === 'register' ? styles.tabActive : ''].join(' ')}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {mode === 'register' && (
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              minLength={2}
            />
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete={mode === 'login' ? 'email' : 'new-email'}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {(error || urlError) && (
            <div className={styles.error} role="alert">
              {error ||
                (urlError === 'google_failed'
                  ? 'Google sign-in failed. Please try again.'
                  : 'Authentication failed.')}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>

          {mode === 'login' && (
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot your password?
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
