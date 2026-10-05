import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminManager({ onDataChanged }) {
  const [tyres, setTyres] = useState([]);
  const [tyreSales, setTyreSales] = useState([]);
  const [evSessions, setEvSessions] = useState([]);
  const [fleetTrips, setFleetTrips] = useState([]);
  const [fleetExpenses, setFleetExpenses] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('tyres');
  const [message, setMessage] = useState(null);

  const fetchAllData = async () => {
    try {
      const [tyresRes, salesRes, evSessRes, fleetRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tyres'),
        axios.get('http://localhost:5000/api/tyres/admin/sales'),
        axios.get('http://localhost:5000/api/ev/sessions'),
        axios.get('http://localhost:5000/api/fleet/admin/records')
      ]);

      if (tyresRes.data.success) setTyres(tyresRes.data.data);
      if (salesRes.data.success) setTyreSales(salesRes.data.data);
      if (evSessRes.data.success) setEvSessions(evSessRes.data.data);
      if (fleetRes.data.success) {
        setFleetTrips(fleetRes.data.trips);
        setFleetExpenses(fleetRes.data.expenses);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerChange = () => {
    fetchAllData();
    if (onDataChanged) onDataChanged();
  };

  // Delete Handlers
  const handleDeleteTyre = async (id) => {
    if (!window.confirm('Delete this tyre and all associated sales records?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tyres/${id}`);
      setMessage({ type: 'success', text: 'Tyre deleted successfully.' });
      triggerChange();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete tyre.' });
    }
  };

  const handleDeleteTyreSale = async (id) => {
    if (!window.confirm('Delete this sale record? (Stock will be automatically restored).')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tyres/sales/${id}`);
      setMessage({ type: 'success', text: 'Sale deleted and stock restored.' });
      triggerChange();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete sale.' });
    }
  };

  const handleDeleteEVSession = async (id) => {
    if (!window.confirm('Delete this charging session?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/ev/sessions/${id}`);
      setMessage({ type: 'success', text: 'EV session removed.' });
      triggerChange();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete EV session.' });
    }
  };

  const handleDeleteFleetTrip = async (id) => {
    if (!window.confirm('Delete this trip earning record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/fleet/trips/${id}`);
      setMessage({ type: 'success', text: 'Trip record deleted.' });
      triggerChange();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete trip.' });
    }
  };

  const handleDeleteFleetExpense = async (id) => {
    if (!window.confirm('Delete this expense voucher?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/fleet/expenses/${id}`);
      setMessage({ type: 'success', text: 'Expense voucher deleted.' });
      triggerChange();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to delete expense.' });
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
        <h5 className="m-0 fw-bold">🛡️ Database Administration & Data Cleanup</h5>
        <span className="badge bg-danger">Admin Privileges Active</span>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'tyres' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('tyres')}
            >
              Tyre Inventory & Sales
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'ev' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('ev')}
            >
              EV Charging Sessions
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'fleet' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('fleet')}
            >
              Fleet Trips & Expenses
            </button>
          </li>
        </ul>

        {/* SUBTAB 1: TYRES */}
        {activeSubTab === 'tyres' && (
          <div>
            <h6 className="fw-bold mb-3">Tyres in Catalog</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Brand</th>
                    <th>Size</th>
                    <th>Cost / Sell Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tyres.map(t => (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td>{t.brand} {t.pattern}</td>
                      <td><span className="badge bg-secondary">{t.size}</span></td>
                      <td>Rs. {Number(t.buying_price).toLocaleString()} / Rs. {Number(t.selling_price).toLocaleString()}</td>
                      <td><strong>{t.stock_quantity}</strong></td>
                      <td>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteTyre(t.id)}>
                          Delete Tyre
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h6 className="fw-bold mb-3">Sales Records (Deleting will restore inventory stock)</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Sale ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Billed (LKR)</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tyreSales.length === 0 ? (
                    <tr><td colSpan="7" className="text-center text-muted">No sales found</td></tr>
                  ) : (
                    tyreSales.map(s => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td>{s.customer_name}</td>
                        <td>{s.brand} ({s.size})</td>
                        <td>{s.quantity_sold}</td>
                        <td>Rs. {Number(s.total_amount).toLocaleString()}</td>
                        <td className="small text-muted">{new Date(s.sale_date).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTyreSale(s.id)}>
                            Delete & Restore Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: EV SESSIONS */}
        {activeSubTab === 'ev' && (
          <div className="table-responsive">
            <h6 className="fw-bold mb-3">Recorded EV Sessions</h6>
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Session ID</th>
                  <th>Vehicle</th>
                  <th>Bay</th>
                  <th>Delivered Energy</th>
                  <th>Total Billed</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {evSessions.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted">No charging sessions</td></tr>
                ) : (
                  evSessions.map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td className="fw-semibold">{s.vehicle_number}</td>
                      <td>{s.charging_point_name}</td>
                      <td>{s.energy_consumed_kwh} kWh</td>
                      <td>Rs. {Number(s.total_amount).toLocaleString()}</td>
                      <td className="small text-muted">{new Date(s.start_time).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteEVSession(s.id)}>
                          Delete Session
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 3: FLEET TRIPS & EXPENSES */}
        {activeSubTab === 'fleet' && (
          <div>
            <h6 className="fw-bold mb-3">Trip Revenue Entries</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Trip ID</th>
                    <th>Vehicle</th>
                    <th>Platform</th>
                    <th>Gross (LKR)</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetTrips.map(tr => (
                    <tr key={tr.id}>
                      <td>#{tr.id}</td>
                      <td>{tr.plate_number} ({tr.model})</td>
                      <td><span className="badge bg-primary">{tr.platform}</span></td>
                      <td className="text-success fw-bold">Rs. {Number(tr.gross_earnings).toLocaleString()}</td>
                      <td>{tr.trip_date?.substring(0, 10)}</td>
                      <td>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteFleetTrip(tr.id)}>
                          Delete Trip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h6 className="fw-bold mb-3">Expense Vouchers</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Expense ID</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Amount (LKR)</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetExpenses.map(ex => (
                    <tr key={ex.id}>
                      <td>#{ex.id}</td>
                      <td>{ex.plate_number}</td>
                      <td><span className="badge bg-warning text-dark">{ex.expense_type}</span></td>
                      <td className="text-danger fw-bold">Rs. {Number(ex.amount).toLocaleString()}</td>
                      <td>{ex.description || '—'}</td>
                      <td>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteFleetExpense(ex.id)}>
                          Delete Expense
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManager;