import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function AdminManager({ onDataChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New User Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Shop Manager');
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('dss_token');
      const res = await axios.get(`${API_BASE}/api/auth/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch access control directory.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    try {
      const token = localStorage.getItem('dss_token');
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        name: username.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'User provisioned successfully.');
        setUsername('');
        setEmail('');
        setPassword('');
        fetchUsers();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating user.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading Access Control...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <span className="badge bg-danger-subtle text-danger px-2 py-1 rounded-pill fw-semibold">
            Security & RBAC
          </span>
          <h4 className="fw-bolder m-0 mt-1">Admin Control & User Directory</h4>
        </div>
        <button className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold" onClick={fetchUsers}>
          🔄 Refresh Directory
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-3">{error}</div>}
      {successMsg && <div className="alert alert-success rounded-3">{successMsg}</div>}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header py-3 px-4 border-bottom bg-body d-flex justify-content-between align-items-center">
              <h6 className="fw-bold m-0">Authorized System Operators</h6>
              <span className="badge bg-secondary rounded-pill">{users.length} Users</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">ID</th>
                      <th>Account</th>
                      <th>Work Email</th>
                      <th>Assigned Role</th>
                      <th className="pe-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-4 fw-semibold text-secondary">#{u.id}</td>
                        <td className="fw-bold">{u.name || u.username}</td>
                        <td><code>{u.email}</code></td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              u.role === 'Admin'
                                ? 'bg-danger-subtle text-danger'
                                : u.role === 'Owner'
                                ? 'bg-primary-subtle text-primary'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="pe-4 text-secondary small">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3">Provision New Account</h6>
            <form onSubmit={handleRegisterUser} className="d-flex flex-column gap-2">
              <div>
                <label className="form-label small fw-semibold text-secondary">Username</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. kamal_p"
                  required
                />
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Work Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm rounded-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. kamal@dss.lk"
                  required
                />
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Initial Password</label>
                <input
                  type="password"
                  className="form-control form-control-sm rounded-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Access Permission Tier</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Shop Manager">Shop Manager (Tyres)</option>
                  <option value="EV Operator">EV Operator (Charging)</option>
                  <option value="EV System Manager">EV System Manager</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Driver">Fleet Driver</option>
                  <option value="Owner">Owner (Executive Read-All)</option>
                  <option value="Admin">Administrator (Full Access)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-danger btn-sm rounded-pill fw-semibold mt-3 py-2">
                Create Operator Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminManager;
