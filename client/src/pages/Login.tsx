import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../LoginPage.css';
import { apiService } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginFormState {
  username: string;
  password: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const [form, setForm] = useState<LoginFormState>({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error as soon as the user starts correcting their input
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.login(form.username, form.password);
      localStorage.setItem('user', JSON.stringify(response.user));
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="login-page">
      <Link className="ghost-btn login-back" to="/">
        <i className="fa-solid fa-arrow-left" />
        Back to main page
      </Link>

      <section className="login-shell">
        {/* Brand header */}
        <div className="login-brand">
          <span className="brand-mark">V</span>
          <div>
            <p className="brand-name">Welcome back to Vie</p>
            <p className="brand-tag">Accountability, turned competitive.</p>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="login-subtitle">Use your username and password to continue.</p>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              color: '#c5203f',
              fontWeight: 600,
              background: 'rgba(197,32,63,0.07)',
              border: '1px solid rgba(197,32,63,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 14,
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
            {error}
          </div>
        )}

        {/* Login form */}
        <form className="login-form" onSubmit={handleLogin}>
          <label>
            Username
            <input
              type="text"
              name="username"
              placeholder="demo"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
              disabled={isLoading}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </label>

          <button
            type="submit"
            className="primary-btn full-width"
            disabled={isLoading || !form.username || !form.password}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <i className="fa-solid fa-arrow-right-to-bracket" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <p className="login-meta">
          Don't have an account?{' '}
          <Link to="/register">Register here</Link>
        </p>
      </section>
    </div>
  );
}
