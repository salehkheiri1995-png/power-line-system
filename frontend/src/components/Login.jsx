import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await registerUser(username, password);
        alert('✅ ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید.');
        setIsRegistering(false);
      } else {
        const res = await loginUser(username, password);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('permissions', res.data.permissions);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: var(--space-4);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: var(--space-10) var(--space-8);
          animation: scaleIn 0.3s ease;
        }
        .login-title {
          text-align: center;
          font-size: var(--text-2xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-8);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .login-toggle {
          background: none;
          border: none;
          color: var(--accent-cyan);
          cursor: pointer;
          font-family: inherit;
          font-size: var(--text-sm);
          text-decoration: underline;
          transition: color var(--transition-fast);
        }
        .login-toggle:hover {
          color: #fff;
        }
      `}</style>

      <div className="glass-card login-card">
        <h2 className="login-title">
          {isRegistering ? '📝 ثبت‌نام' : '⚡ ورود به سامانه'}
        </h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label" htmlFor="username">نام کاربری</label>
            <input
              id="username"
              className="input-field"
              placeholder="نام کاربری را وارد کنید"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="password">رمز عبور</label>
            <input
              id="password"
              className="input-field"
              placeholder="رمز عبور را وارد کنید"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="message error">{error}</div>
          )}

          <button
            type="submit"
            className="btn-glow"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading ? '⏳ ...' : isRegistering ? '✅ ثبت‌نام' : '🚀 ورود'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
          <button
            className="login-toggle"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          >
            {isRegistering ? 'قبلاً حساب دارید؟ وارد شوید' : 'حساب ندارید؟ ثبت‌نام کنید'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
