import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      if (response.data && response.data.success) {
        localStorage.setItem('dss_token', response.data.token);
        localStorage.setItem('dss_user', JSON.stringify(response.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }
      } else {
        setError(response.data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Cannot reach authentication server. Verify backend is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3"
      style={{ background: 'radial-gradient(ellipse at top, #1e293b, #0f172a)' }}
    >
      {/* Brand Header */}
      <div className="text-center mb-4">
        <div className="d-inline-flex p-3 rounded-4 bg-primary text-white fs-3 shadow-lg mb-3">
          ⚡
        </div>
        <h2 className="fw-bolder text-white tracking-tight m-0">
          Integrated Business DSS
        </h2>
        <span className="small" style={{ color: '#94a3b8' }}>
          Multi-Sector Enterprise Decision Portal • Piliyandala Hub
        </span>
      </div>

      {/* Main Login Card */}
      <div
        className="card border-0 rounded-4 shadow-lg p-4 p-md-5"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#1e293b',
          border: '1px solid #334155'
        }}
      >
        <div className="mb-4">
          <h4 className="fw-bold text-white mb-1">Sign In</h4>
          <p className="small m-0" style={{ color: '#94a3b8' }}>
            Enter your authorized system credentials to continue.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-4 d-flex align-items-center gap-2" role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-white">Work Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg rounded-3 fs-6"
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                color: '#f8fafc'
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-white">Password</label>
            <input
              type="password"
              className="form-control form-control-lg rounded-3 fs-6"
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                color: '#f8fafc'
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-100 rounded-3 fw-semibold shadow-sm fs-6 py-2"
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Authenticating...
              </span>
            ) : (
              'Sign In to Dashboard →'
            )}
          </button>
        </form>
      </div>

      <div className="text-center mt-4 small" style={{ color: '#64748b' }}>
        Protected by Encrypted Role-Based Access Control • Integrated DSS
      </div>
    </div>
  );
}

export default Login;