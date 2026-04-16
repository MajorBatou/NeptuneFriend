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

          {error && (
            <div className={styles.error} role="alert">
              {error}
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

        {/* Demo credentials notice */}
        {mode === 'login' && (
          <div className={styles.demo}>
            <p className={styles.demoTitle}>Demo credentials</p>
            <p className={styles.demoText}>
              Register a new account to get started — no email verification required in development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
