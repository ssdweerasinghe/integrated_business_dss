import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FleetModule({ onDataChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form state: Trip Earnings
  const [tripVehicleId, setTripVehicleId] = useState('');
  const [platform, setPlatform] = useState('Uber');
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [grossEarnings, setGrossEarnings] = useState('');

  // Form state: Vehicle Expense
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Fuel');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/fleet/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
        if (res.data.data.length > 0) {
          if (!tripVehicleId) setTripVehicleId(res.data.data[0].id);
          if (!expenseVehicleId) setExpenseVehicleId(res.data.data[0].id);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleRecordTrip = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/fleet/trips', {
        vehicle_id: parseInt(tripVehicleId),
        platform,
        trip_date: tripDate,
        gross_earnings: parseFloat(grossEarnings)
      });
      setStatusMessage({ type: 'success', text: 'Trip earnings recorded successfully!' });
      setGrossEarnings('');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to record trip' });
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/fleet/expenses', {
        vehicle_id: parseInt(expenseVehicleId),
        expense_type: expenseType,
        amount: parseFloat(expenseAmount),
        expense_date: expenseDate,
        description
      });
      setStatusMessage({ type: 'success', text: 'Vehicle expense logged successfully!' });
      setExpenseAmount('');
      setDescription('');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to log expense' });
    }
  };

  if (loading) return <div>Loading Fleet Operations...</div>;

  return (
    <div className="container-fluid p-0">
      {statusMessage && (
        <div className={`alert alert-${statusMessage.type} alert-dismissible fade show`} role="alert">
          {statusMessage.text}
          <button type="button" className="btn-close" onClick={() => setStatusMessage(null)}></button>
        </div>
      )}

      {/* Fleet Overview Cards */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white fw-bold py-3">🚗 Registered Fleet Vehicles</div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Plate Number</th>
                <th>Model</th>
                <th>Designated Driver</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-3 text-muted">No vehicles registered.</td></tr>
              ) : (
                vehicles.map(v => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td className="fw-bold">{v.plate_number}</td>
                    <td>{v.model}</td>
                    <td>{v.driver_name}</td>
                    <td><span className="badge bg-success">{v.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Record Trip Gross Earnings */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">💰 Record Daily Ride-Hailing Earnings</div>
            <div className="card-body">
              <form onSubmit={handleRecordTrip}>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Select Vehicle</label>
                  <select
                    className="form-select"
                    value={tripVehicleId}
                    onChange={e => setTripVehicleId(e.target.value)}
                    required
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model} ({v.driver_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Platform</label>
                    <select className="form-select" value={platform} onChange={e => setPlatform(e.target.value)}>
                      <option value="Uber">Uber</option>
                      <option value="PickMe">PickMe</option>
                      <option value="Private Hire">Private Hire</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={tripDate}
                      onChange={e => setTripDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Gross Revenue (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 18500"
                    value={grossEarnings}
                    onChange={e => setGrossEarnings(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={vehicles.length === 0}>
                  Log Trip Revenue
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Record Vehicle Operational Expense */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">⛽ Record Vehicle Operational Expense</div>
            <div className="card-body">
              <form onSubmit={handleRecordExpense}>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Select Vehicle</label>
                  <select
                    className="form-select"
                    value={expenseVehicleId}
                    onChange={e => setExpenseVehicleId(e.target.value)}
                    required
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} — {v.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Expense Type</label>
                    <select className="form-select" value={expenseType} onChange={e => setExpenseType(e.target.value)}>
                      <option value="Fuel">Fuel</option>
                      <option value="Maintenance">Routine Maintenance / Service</option>
                      <option value="Insurance">Insurance / Licensing</option>
                      <option value="Other">Repairs / Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Expense Date</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Amount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 5200"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description / Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Full petrol refill at Piliyandala shed"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-warning w-100" disabled={vehicles.length === 0}>
                  Log Expense
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FleetModule;