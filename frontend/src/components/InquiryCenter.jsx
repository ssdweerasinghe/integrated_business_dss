import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const INQUIRY_ROLES = [
  'Shop Manager',
  'EV Operator',
  'EV System Manager',
  'EV Manager',
  'Fleet Manager',
  'Fleet Operation Manager'
];

function InquiryCenter({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const roleBadge = useMemo(() => {
    if (isAdmin) return 'Admin View';
    if (INQUIRY_ROLES.includes(currentUser?.role)) return currentUser.role;
    return 'Operational Access';
  }, [currentUser, isAdmin]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('dss_token');
      const endpoint = isAdmin ? `${API_BASE}/api/inquiries` : `${API_BASE}/api/inquiries/my`;
      const res = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Inquiry fetch failed', err);
      setMessage(err.response?.data?.message || 'Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentUser?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const token = localStorage.getItem('dss_token');
      const res = await axios.post(
        `${API_BASE}/api/inquiries`,
        { title, content, role: currentUser?.role },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (res.data?.success) {
        setTitle('');
        setContent('');
        setMessage('Inquiry submitted successfully.');
        await fetchInquiries();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to submit inquiry.');
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill fw-semibold">
            {isAdmin ? 'Operations Control' : 'Support Request'}
          </span>
          <h4 className="fw-bolder m-0 mt-1">{isAdmin ? 'Manage Inquiries' : 'Inquiries'}</h4>
        </div>
        <span className="badge bg-secondary rounded-pill px-3 py-2">{roleBadge}</span>
      </div>

      {!isAdmin && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h6 className="fw-bold mb-3">Submit Inquiry</h6>
          {message && <div className="alert alert-success small py-2 mb-3">{message}</div>}
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12">
              <label className="form-label small text-secondary">Title</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small text-secondary">Content</label>
              <textarea
                className="form-control"
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold">
                Submit Inquiry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header py-3 px-4 border-bottom bg-body d-flex justify-content-between align-items-center">
          <h6 className="fw-bold m-0">{isAdmin ? 'All Submitted Inquiries' : 'My Inquiries'}</h6>
          <span className="badge bg-secondary rounded-pill">{items.length} Records</span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-secondary">Loading inquiries...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-secondary">No inquiries found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small text-uppercase">
                  <tr>
                    <th className="ps-4">Title</th>
                    <th>{isAdmin ? 'Submitted By' : 'Role'}</th>
                    <th>Created</th>
                    <th className="pe-4">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4 fw-semibold">{item.title}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary rounded-pill">
                          {item.submitted_by_role || item.role || 'Operational'}
                        </span>
                      </td>
                      <td className="text-secondary small">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="pe-4">{item.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InquiryCenter;
