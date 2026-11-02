import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function FleetModule({ currentUser, onDataChanged }) {
  const isAdmin = currentUser?.role === 'Admin';
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vehicleId, setVehicleId] = useState('');
  const [platform, setPlatform] = useState('Uber');
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [revenue, setRevenue] = useState('');

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
        platform,
        trip_date: tripDate,
        gross_earnings: parseFloat(revenue)
      });

      if (res.data?.success) {
        setVehicleId('');
        setPlatform('Uber');
        setTripDate(new Date().toISOString().slice(0, 10));
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

  const handleDeleteTrip = async (tripId) => {
    if (!isAdmin) {
      alert('Only administrators can delete fleet trip records.');
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/fleet/trips/${tripId}`);
      fetchFleetData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete trip record.');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!isAdmin) {
      alert('Only administrators can delete fleet vehicles.');
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/fleet/vehicles/${vehicleId}`);
      fetchFleetData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete vehicle.');
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
                                <div className="d-flex justify-content-center align-items-center gap-2">
                                  <span className="badge bg-success-subtle text-success rounded-pill px-2">
                                    {v.status}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      className="btn btn-outline-danger btn-xs rounded-pill px-2 py-0"
                                      onClick={() => handleDeleteVehicle(v.id)}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
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

        {/* Trip Revenue Input */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3">Log Dispatch Revenue</h6>
            <form onSubmit={handleAddTrip} className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Vehicle</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
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
                <label className="form-label small fw-semibold text-secondary">Platform</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="Uber">Uber</option>
                  <option value="PickMe">PickMe</option>
                  <option value="Private Hire">Private Hire</option>
                  <option value="Fleet Dispatch">Fleet Dispatch</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Trip Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm rounded-3"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">Gross Earnings (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm rounded-3"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="e.g. 15000"
                  required
                />
              </div>

              <div className="col-12 mt-2">
                <button type="submit" className="btn btn-warning btn-sm rounded-pill fw-semibold w-100 py-2">
                  Record Dispatch Trip
                </button>
              </div>
            </form>
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
                  <th className="ps-4">Platform</th>
                  <th>Vehicle</th>
                  <th>Trip Date</th>
                  <th>Gross Fare (Rs.)</th>
                  <th>Status</th>
                  {isAdmin && <th className="pe-4 text-center">Delete</th>}
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-secondary">
                      No trip activity recorded.
                    </td>
                  </tr>
                ) : (
                  trips.map((tr) => (
                    <tr key={tr.id}>
                      <td className="ps-4 fw-bold">{tr.platform || 'Fleet Dispatch'}</td>
                      <td><code>{tr.plate_number || `Unit #${tr.vehicle_id}`}</code></td>
                      <td>{new Date(tr.trip_date).toLocaleDateString()}</td>
                      <td className="text-success fw-bold">+Rs. {Number(tr.gross_earnings ?? tr.revenue).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success rounded-pill px-2">Settled</span>
                      </td>
                      {isAdmin && (
                        <td className="pe-4 text-center">
                          <button
                            className="btn btn-outline-danger btn-sm rounded-pill"
                            onClick={() => handleDeleteTrip(tr.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
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