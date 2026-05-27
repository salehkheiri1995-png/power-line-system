import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // ثبت‌نام (بدون توکن)
        await registerUser(username, password);
        alert('✅ ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید.');
        setIsRegistering(false);
        setError('');
      } else {
        const res = await loginUser(username, password);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('permissions', res.data.permissions);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'خطایی رخ داد');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0b10' }}>
      <div className="glass-card" style={{ width: '380px', padding: '40px 30px' }}>
        <h2 style={{ color: 'var(--accent-cyan)', textAlign: 'center', marginBottom: '20px' }}>
          {isRegistering ? '📝 ثبت‌نام' : '🚀 ورود'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="نام کاربری"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            placeholder="رمز عبور"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          {error && <div style={{ color: '#ff4d4d', marginBottom: 10, textAlign: 'center' }}>{error}</div>}
          <button type="submit" className="btn-glow" style={{ width: '100%', marginTop: 10 }}>
            {isRegistering ? '✅ ثبت‌نام' : 'ورود'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? 'قبلاً حساب دارید؟ وارد شوید' : 'حساب ندارید؟ ثبت‌نام کنید'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(10,15,25,0.8)',
  border: '1px solid rgba(0,240,255,0.3)',
  borderRadius: '8px',
  color: '#e0f0ff',
  marginBottom: '15px',
  outline: 'none',
};

export default Login;