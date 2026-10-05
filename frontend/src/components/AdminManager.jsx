import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminManager({ onDataChanged }) {
  const [tyres, setTyres] = useState([]);
  const [tyreSales, setTyreSales] = useState([]);
  const [evPoints, setEvPoints] = useState([]);
  const [evSessions, setEvSessions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fleetTrips, setFleetTrips] = useState([]);
  const [fleetExpenses, setFleetExpenses] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('tyres');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [tyresRes, salesRes, evPointsRes, evSessRes, vehiclesRes, fleetRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tyres'),
        axios.get('http://localhost:5000/api/tyres/sales/history'),
        axios.get('http://localhost:5000/api/ev/points'),
        axios.get('http://localhost:5000/api/ev/sessions'),
        axios.get('http://localhost:5000/api/fleet/vehicles'),
        axios.get('http://localhost:5000/api/fleet/admin/records')
      ]);

      if (tyresRes.data?.success) setTyres(tyresRes.data.data);
      if (salesRes.data?.success) setTyreSales(salesRes.data.data);
      if (evPointsRes.data?.success) setEvPoints(evPointsRes.data.data);
      if (evSessRes.data?.success) setEvSessions(evSessRes.data.data);
      if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data);
      if (fleetRes.data?.success) {
        setFleetTrips(fleetRes.data.trips);
        setFleetExpenses(fleetRes.data.expenses);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error fetching database records for admin control.' });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerChange = () => {
    fetchAllData();
    if (onDataChanged) onDataChanged();
  };

  // --- TYRE ACTIONS ---
  const handleDeleteTyre = async (id) => {
    if (!window.confirm('Delete this tyre and all associated sales records permanently?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tyres/${id}`);
      setMessage({ type: 'success', text: 'Tyre product and linked sales removed.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete tyre SKU.' });
    }
  };

  const handleDeleteTyreSale = async (id) => {
    if (!window.confirm('Delete this sale record? Inventory stock will be automatically restored.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tyres/sales/${id}`);
      setMessage({ type: 'success', text: 'Sale deleted and inventory stock restored successfully.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete sale.' });
    }
  };

  // --- EV ACTIONS ---
  const handleDeleteEVSession = async (id) => {
    if (!window.confirm('Delete this charging session record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/ev/sessions/${id}`);
      setMessage({ type: 'success', text: 'EV session removed from ledger.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete EV session.' });
    }
  };

  const handleDeleteEVPoint = async (id) => {
    if (!window.confirm('Delete this charging bay and all its associated session history?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/ev/points/${id}`);
      setMessage({ type: 'success', text: 'Charging point and all its sessions deleted.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete charging point.' });
    }
  };

  // --- FLEET ACTIONS ---
  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Delete this vehicle and ALL its linked trip earnings and expense vouchers?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/fleet/vehicles/${id}`);
      setMessage({ type: 'success', text: 'Vehicle and all linked fleet logs deleted.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete vehicle.' });
    }
  };

  const handleDeleteFleetTrip = async (id) => {
    if (!window.confirm('Delete this trip earning record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/fleet/trips/${id}`);
      setMessage({ type: 'success', text: 'Trip earning record deleted.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete trip record.' });
    }
  };

  const handleDeleteFleetExpense = async (id) => {
    if (!window.confirm('Delete this expense voucher?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/fleet/expenses/${id}`);
      setMessage({ type: 'success', text: 'Expense voucher deleted.' });
      triggerChange();
    } catch {
      setMessage({ type: 'danger', text: 'Failed to delete expense voucher.' });
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading Admin Data Center...</div>;
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 className="m-0 fw-bold">🛡️ Master Data Administration & Global Rollback</h5>
          <small className="text-light opacity-75">Cascade Deletion, Inventory Reversals, and Audit Controls</small>
        </div>
        <span className="badge bg-danger fs-6 px-3 py-2">System Administrator</span>
      </div>

      <div className="card-body">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Global Record Counts */}
        <div className="row g-2 mb-4 text-center">
          <div className="col-6 col-md-2">
            <div className="p-2 border rounded bg-light">
              <span className="small text-muted">Tyres / Sales</span>
              <div className="fw-bold">{tyres.length} / {tyreSales.length}</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="p-2 border rounded bg-light">
              <span className="small text-muted">EV Bays / Sessions</span>
              <div className="fw-bold">{evPoints.length} / {evSessions.length}</div>
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="p-2 border rounded bg-light">
              <span className="small text-muted">Vehicles</span>
              <div className="fw-bold">{vehicles.length} Units</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded bg-light">
              <span className="small text-muted">Fleet Trips Logged</span>
              <div className="fw-bold">{fleetTrips.length} Trips</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 border rounded bg-light">
              <span className="small text-muted">Expense Vouchers</span>
              <div className="fw-bold">{fleetExpenses.length} Vouchers</div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'tyres' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('tyres')}
            >
              🛞 Tyre Inventory & Sales
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'ev' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('ev')}
            >
              ⚡ EV Charging Stations & Sessions
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeSubTab === 'fleet' ? 'active fw-bold' : ''}`}
              onClick={() => setActiveSubTab('fleet')}
            >
              🚗 Fleet Roster, Trips & Expenses
            </button>
          </li>
        </ul>

        {/* ============================================================ */}
        {/* SUBTAB 1: TYRES */}
        {/* ============================================================ */}
        {activeSubTab === 'tyres' && (
          <div>
            <h6 className="fw-bold mb-3 text-dark">Tyres In Catalog (Total: {tyres.length})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>SKU ID</th>
                    <th>Brand & Tread Pattern</th>
                    <th>Size</th>
                    <th>Buying Cost</th>
                    <th>Selling Price</th>
                    <th>Unit Margin</th>
                    <th>In Stock</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tyres.length === 0 ? (
                    <tr><td colSpan="8" className="text-center text-muted">No tyres registered.</td></tr>
                  ) : (
                    tyres.map(t => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td className="fw-semibold">{t.brand} {t.pattern}</td>
                        <td><span className="badge bg-secondary">{t.size}</span></td>
                        <td>Rs. {Number(t.buying_price).toLocaleString()}</td>
                        <td>Rs. {Number(t.selling_price).toLocaleString()}</td>
                        <td className="text-success fw-bold">
                          +Rs. {(Number(t.selling_price) - Number(t.buying_price)).toLocaleString()}
                        </td>
                        <td><strong>{t.stock_quantity}</strong></td>
                        <td className="text-center">
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteTyre(t.id)}>
                            Delete Tyre
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h6 className="fw-bold mb-3 text-dark">
              Tyre Sales Audit (Deleting restores inventory stock)
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Sale ID</th>
                    <th>Customer Name</th>
                    <th>Tyre Spec</th>
                    <th>Qty Sold</th>
                    <th>Unit Cost</th>
                    <th>Unit Price</th>
                    <th>Gross Profit</th>
                    <th>Billed Total</th>
                    <th>Sale Timestamp</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tyreSales.length === 0 ? (
                    <tr><td colSpan="10" className="text-center text-muted">No sales logged.</td></tr>
                  ) : (
                    tyreSales.map(s => (
                      <tr key={s.id}>
                        <td className="fw-semibold">#{s.id}</td>
                        <td>{s.customer_name}</td>
                        <td>{s.brand} ({s.size})</td>
                        <td><span className="badge bg-primary px-2">{s.quantity_sold}</span></td>
                        <td className="text-muted">Rs. {Number(s.buying_price).toLocaleString()}</td>
                        <td>Rs. {Number(s.unit_price).toLocaleString()}</td>
                        <td className="text-success fw-bold">
                          +Rs. {Number(s.gross_profit || ((s.unit_price - s.buying_price) * s.quantity_sold)).toLocaleString()}
                        </td>
                        <td className="fw-bold">Rs. {Number(s.total_amount).toLocaleString()}</td>
                        <td className="small text-muted">{new Date(s.sale_date).toLocaleString()}</td>
                        <td className="text-center">
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

        {/* ============================================================ */}
        {/* SUBTAB 2: EV CHARGING */}
        {/* ============================================================ */}
        {activeSubTab === 'ev' && (
          <div>
            <h6 className="fw-bold mb-3 text-dark">Charging Points & Tariff Structure</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Point ID</th>
                    <th>Bay Name</th>
                    <th>Charger Type</th>
                    <th>Tariff Rate</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evPoints.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted">No charging points registered.</td></tr>
                  ) : (
                    evPoints.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td className="fw-semibold">{p.name}</td>
                        <td><span className="badge bg-info text-dark">{p.charger_type}</span></td>
                        <td className="fw-bold text-success">Rs. {Number(p.rate_per_kwh).toLocaleString()} / kWh</td>
                        <td><span className="badge bg-success">{p.status}</span></td>
                        <td className="text-center">
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteEVPoint(p.id)}>
                            Delete Point & All Sessions
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h6 className="fw-bold mb-3 text-dark">Active Charging Sessions Log</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Session ID</th>
                    <th>Vehicle Reg.</th>
                    <th>Charging Bay</th>
                    <th>Energy Consumed</th>
                    <th>Tariff Rate</th>
                    <th>Billed Revenue</th>
                    <th>Timestamp</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evSessions.length === 0 ? (
                    <tr><td colSpan="8" className="text-center text-muted">No charging sessions logged.</td></tr>
                  ) : (
                    evSessions.map(s => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td className="fw-semibold">{s.vehicle_number}</td>
                        <td>{s.charging_point_name}</td>
                        <td><strong>{s.energy_consumed_kwh} kWh</strong></td>
                        <td className="text-muted">Rs. {Number(s.rate_per_kwh).toLocaleString()}</td>
                        <td className="text-success fw-bold">Rs. {Number(s.total_amount).toLocaleString()}</td>
                        <td className="small text-muted">{new Date(s.start_time).toLocaleString()}</td>
                        <td className="text-center">
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEVSession(s.id)}>
                            Delete Session
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

        {/* ============================================================ */}
        {/* SUBTAB 3: FLEET ROSTER, TRIPS & EXPENSES */}
        {/* ============================================================ */}
        {activeSubTab === 'fleet' && (
          <div>
            <h6 className="fw-bold mb-3 text-dark">Registered Fleet Vehicles</h6>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Vehicle ID</th>
                    <th>License Plate</th>
                    <th>Make & Model</th>
                    <th>Assigned Driver</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted">No vehicles registered.</td></tr>
                  ) : (
                    vehicles.map(v => (
                      <tr key={v.id}>
                        <td>#{v.id}</td>
                        <td className="fw-bold font-monospace">{v.plate_number}</td>
                        <td>{v.model}</td>
                        <td>{v.driver_name || <span className="text-muted italic">Unassigned</span>}</td>
                        <td>
                          <span className={`badge ${v.status === 'Active' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteVehicle(v.id)}>
                            Delete Vehicle & All Records
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="row g-4">
              {/* Trips Audit Table */}
              <div className="col-12 col-xl-6">
                <h6 className="fw-bold mb-3 text-dark">Trip Earnings Records</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Trip ID</th>
                        <th>Vehicle</th>
                        <th>Platform</th>
                        <th>Gross Fare</th>
                        <th>Date</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetTrips.length === 0 ? (
                        <tr><td colSpan="6" className="text-center text-muted">No trips recorded.</td></tr>
                      ) : (
                        fleetTrips.map(tr => (
                          <tr key={tr.id}>
                            <td>#{tr.id}</td>
                            <td>{tr.plate_number}</td>
                            <td>
                              <span className={`badge ${tr.platform === 'PickMe' ? 'bg-warning text-dark' : 'bg-dark'}`}>
                                {tr.platform}
                              </span>
                            </td>
                            <td className="text-success fw-bold">Rs. {Number(tr.gross_earnings).toLocaleString()}</td>
                            <td className="small text-muted">{tr.trip_date?.substring(0, 10)}</td>
                            <td className="text-center">
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteFleetTrip(tr.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Vouchers Table */}
              <div className="col-12 col-xl-6">
                <h6 className="fw-bold mb-3 text-dark">Operational Expense Vouchers</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Vehicle</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetExpenses.length === 0 ? (
                        <tr><td colSpan="6" className="text-center text-muted">No expenses recorded.</td></tr>
                      ) : (
                        fleetExpenses.map(ex => (
                          <tr key={ex.id}>
                            <td>#{ex.id}</td>
                            <td>{ex.plate_number}</td>
                            <td><span className="badge bg-secondary">{ex.expense_type}</span></td>
                            <td className="text-danger fw-bold">-Rs. {Number(ex.amount).toLocaleString()}</td>
                            <td className="small text-muted">{ex.description || '—'}</td>
                            <td className="text-center">
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteFleetExpense(ex.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManager;