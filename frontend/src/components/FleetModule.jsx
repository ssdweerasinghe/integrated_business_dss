import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function FleetModule({ onDataChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Trip State
  const [vehicleId, setVehicleId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [revenue, setRevenue] = useState('');

  // Expense State
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Fuel');
  const [amount, setAmount] = useState('');

  const fetchFleetData = async () => {
    try {
      const [vehRes, tripRes] = await Promise.all([
        axios.get(`${API_BASE}/api/fleet/vehicles`),
        axios.get(`${API_BASE}/api/fleet/trips`)
      ]);

      if (vehRes.data?.success) setVehicles(vehRes.data.data);
      if (tripRes.data?.success) setTrips(tripRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fleet mobility data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/fleet/trips`, {
        vehicle_id: parseInt(vehicleId, 10),
        origin,
        destination,
        distance_km: parseFloat(distanceKm),
        revenue: parseFloat(revenue)
      });

      if (res.data?.success) {
        setOrigin('');
        setDestination('');
        setDistanceKm('');
        setRevenue('');
        fetchFleetData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('Error recording trip: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/fleet/expenses`, {
        vehicle_id: parseInt(expVehicleId, 10),
        expense_type: expenseType,
        amount: parseFloat(amount)
      });

      if (res.data?.success) {
        setAmount('');
        fetchFleetData();
        if (onDataChanged) onDataChanged();
        alert('Expense logged successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording expense: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Fleet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <span className="badge bg-warning-subtle text-warning-emphasis px-2 py-1 rounded-pill fw-semibold">
            Ride-Hailing & Logistics
          </span>
          <h4 className="fw-bolder m-0 mt-1">Fleet Mobility & Fuel Log</h4>
        </div>
        <button className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold" onClick={fetchFleetData}>
          🔄 Refresh Fleet
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-3">{error}</div>}

      <div className="row g-4 mb-4">
        {/* Vehicles Active Fleet */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header py-3 px-4 border-bottom bg-body">
              <h6 className="fw-bold m-0">Registered Fleet Units</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">Vehicle Plate</th>
                      <th>Model</th>
                      <th>Assigned Driver</th>
                      <th className="pe-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-secondary">
                          No vehicles assigned.
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr key={v.id}>
                          <td className="ps-4 fw-bold">{v.plate_number}</td>
                          <td>{v.model}</td>
                          <td>{v.driver_name || 'Unassigned'}</td>
                          <td className="pe-4 text-center">
                            <span className="badge bg-success-subtle text-success rounded-pill px-2">
                              {v.status}
                            </span>
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

        {/* Operational Expense Input */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3">Record Vehicle Expense (Fuel/Repairs)</h6>
            <form onSubmit={handleAddExpense} className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Vehicle</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={expVehicleId}
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select Unit</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} - {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Cost Center</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                >
                  <option value="Fuel">Fuel (ICE Burn)</option>
                  <option value="Maintenance">Routine Service</option>
                  <option value="Tyres">Tyre Replacement</option>
                  <option value="Other">Other Operational</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm rounded-3"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  required
                />
              </div>

              <div className="col-12 mt-2">
                <button type="submit" className="btn btn-warning btn-sm rounded-pill fw-semibold w-100 py-2">
                  Commit Operating Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Trips Registry */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header py-3 px-4 border-bottom bg-body d-flex justify-content-between align-items-center">
          <h6 className="fw-bold m-0">Recent Trips & Fare Collections</h6>
          <span className="badge bg-secondary rounded-pill">{trips.length} Entries</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-4">Trip Route</th>
                  <th>Vehicle</th>
                  <th>Distance</th>
                  <th>Gross Fare (Rs.)</th>
                  <th className="pe-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-secondary">
                      No trip activity recorded.
                    </td>
                  </tr>
                ) : (
                  trips.map((tr) => (
                    <tr key={tr.id}>
                      <td className="ps-4">
                        <span className="fw-bold">{tr.origin}</span> → <span>{tr.destination}</span>
                      </td>
                      <td><code>{tr.plate_number || `Unit #${tr.vehicle_id}`}</code></td>
                      <td>{tr.distance_km} km</td>
                      <td className="text-success fw-bold">+Rs. {Number(tr.revenue).toLocaleString()}</td>
                      <td className="pe-4 text-secondary small">
                        {new Date(tr.trip_date).toLocaleDateString()}
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
  );
}

export default FleetModule;