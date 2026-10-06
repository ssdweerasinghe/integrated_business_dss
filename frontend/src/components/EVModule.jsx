import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EVModule({ onDataChanged }) {
  const [points, setPoints] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Session Logging Form State
  const [selectedPointId, setSelectedPointId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [energyConsumed, setEnergyConsumed] = useState('');

  // Add New Bay Form State
  const [showAddBay, setShowAddBay] = useState(false);
  const [newBayName, setNewBayName] = useState('');
  const [newChargerType, setNewChargerType] = useState('DC Fast CCS2');
  const [newTariffRate, setNewTariffRate] = useState('120');
  const [submittingBay, setSubmittingBay] = useState(false);

  const fetchEVData = async () => {
    try {
      const [pointsRes, sessionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ev/points'),
        axios.get('http://localhost:5000/api/ev/sessions')
      ]);

      if (pointsRes?.data?.success) {
        setPoints(pointsRes.data.data);
        if (pointsRes.data.data.length > 0 && !selectedPointId) {
          setSelectedPointId(pointsRes.data.data[0].id);
        }
      }
      if (sessionsRes?.data?.success) {
        setSessions(sessionsRes.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error connecting to EV station backend services.' });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEVData();
  }, []);

  // 1. Submit Charging Session
  const handleSessionSubmit = async (e) => {
    e.preventDefault();

    const normalizedVehicleNumber = vehicleNumber.trim();
    const normalizedEnergy = Number(energyConsumed);

    if (!selectedPointId || !normalizedVehicleNumber || !energyConsumed || normalizedEnergy <= 0) return;

    try {
      const res = await axios.post('http://localhost:5000/api/ev/sessions', {
        point_id: Number(selectedPointId),
        charging_point_id: Number(selectedPointId),
        vehicle_number: normalizedVehicleNumber,
        energy_consumed_kwh: normalizedEnergy
      });

      if (res.data.success) {
        const billedAmount = Number(res.data.billedAmount ?? res.data.total_amount ?? 0);
        setMessage({
          type: 'success',
          text: `Session recorded for ${normalizedVehicleNumber.toUpperCase()}! Total Billed: Rs. ${billedAmount.toLocaleString()}`
        });
        setVehicleNumber('');
        setEnergyConsumed('');
        fetchEVData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error processing charging session.'
      });
    }
  };

  // 2. Submit New Charging Bay (Bay 2, Bay 3, etc.)
  const handleCreateBaySubmit = async (e) => {
    e.preventDefault();
    if (!newBayName.trim() || !newTariffRate) return;

    setSubmittingBay(true);
    try {
      const res = await axios.post('http://localhost:5000/api/ev/points', {
        name: newBayName.trim(),
        charger_type: newChargerType,
        rate_per_kwh: parseFloat(newTariffRate),
        status: 'Available'
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Charging bay "${newBayName.trim()}" successfully registered!`
        });
        setNewBayName('');
        setNewTariffRate('120');
        setShowAddBay(false);
        fetchEVData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error registering charging bay.'
      });
    } finally {
      setSubmittingBay(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading EV Charging Stations...</div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Top Banner & Bay Creation Toggle */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 small fw-semibold">
              Power Grid Operations
            </span>
            <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 small">
              {points.length} Active Bays
            </span>
          </div>
          <h4 className="fw-bolder m-0 mt-1">⚡ EV Station Management</h4>
        </div>

        <button
          className={`btn ${showAddBay ? 'btn-outline-secondary' : 'btn-primary'} btn-sm px-3 rounded-pill fw-semibold shadow-sm d-flex align-items-center gap-2`}
          onClick={() => setShowAddBay(!showAddBay)}
        >
          {showAddBay ? '✕ Cancel' : '➕ Add New Charging Bay'}
        </button>
      </div>

      {/* Collapsible New Bay Creation Card */}
      {showAddBay && (
        <div className="card shadow-sm border-0 rounded-4 mb-4 border-start border-4 border-primary">
          <div className="card-header bg-body py-3 px-4 border-bottom">
            <h6 className="fw-bold m-0">Register New Charging Bay / Outlet</h6>
            <small className="text-secondary">Expand station capacity with additional chargers</small>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleCreateBaySubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Bay Identifier / Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`e.g. Bay ${points.length + 1} - DC Fast`}
                    value={newBayName}
                    onChange={(e) => setNewBayName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Charger Standard / Type</label>
                  <select
                    className="form-select"
                    value={newChargerType}
                    onChange={(e) => setNewChargerType(e.target.value)}
                  >
                    <option value="DC Fast CCS2">DC Fast CCS2 (60-120 kW)</option>
                    <option value="CHAdeMO">CHAdeMO (50 kW)</option>
                    <option value="AC Type 2">AC Type 2 (22 kW)</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold">Tariff Rate (LKR per kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    className="form-control"
                    placeholder="120.00"
                    value={newTariffRate}
                    onChange={(e) => setNewTariffRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3 rounded-pill"
                  onClick={() => setShowAddBay(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBay}
                  className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold shadow-sm"
                >
                  {submittingBay ? 'Registering...' : 'Save & Activate Bay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Operations Grid */}
      <div className="row g-4 mb-4">
        {/* Charging Points Roster */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-body fw-bold py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <span>Station Bays (Piliyandala)</span>
              <span className="badge bg-secondary rounded-pill">{points.length} Installed</span>
            </div>
            <div className="card-body p-3">
              {points.length === 0 ? (
                <div className="text-secondary text-center py-4">No charging bays registered.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {points.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 border rounded-3 d-flex justify-content-between align-items-center shadow-sm"
                      style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}
                    >
                      <div>
                        <div className="fw-bold">{p.name}</div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className="badge bg-secondary-subtle text-secondary small px-2 py-0">
                            {p.charger_type}
                          </span>
                          <span className="fw-semibold text-success small">
                            Rs. {Number(p.rate_per_kwh).toLocaleString()} / kWh
                          </span>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                        {p.status || 'Available'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Session Form */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-body fw-bold py-3 px-4 border-bottom">
              🔌 Log Vehicle Charging Session
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSessionSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Charging Bay</label>
                  <select
                    className="form-select"
                    value={selectedPointId}
                    onChange={(e) => setSelectedPointId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Charging Bay --</option>
                    {points.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.charger_type}) — Rs. {Number(p.rate_per_kwh).toLocaleString()}/kWh
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-7">
                    <label className="form-label small fw-semibold">Vehicle Plate Number</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. WP CBI-5678"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Energy Delivered (kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      className="form-control"
                      placeholder="e.g. 28.5"
                      value={energyConsumed}
                      onChange={(e) => setEnergyConsumed(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 rounded-3 fw-semibold py-2 shadow-sm">
                  Record Charging & Calculate Fee
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
        <div className="card-header bg-body fw-bold py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
          <span>📋 Recent Charging Sessions</span>
          <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">
            {sessions.length} Sessions Logged
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Session ID</th>
                  <th>Vehicle No</th>
                  <th>Bay</th>
                  <th>Energy (kWh)</th>
                  <th>Tariff Rate</th>
                  <th>Total Billed</th>
                  <th className="pe-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-secondary">
                      No charging sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="ps-4 fw-semibold">#{s.id}</td>
                      <td className="fw-bold">{s.vehicle_number}</td>
                      <td>{s.charging_point_name}</td>
                      <td><span className="badge bg-info-subtle text-info-emphasis">{s.energy_consumed_kwh} kWh</span></td>
                      <td>Rs. {Number(s.rate_per_kwh).toLocaleString()}</td>
                      <td className="fw-bold text-success">Rs. {Number(s.total_amount).toLocaleString()}</td>
                      <td className="pe-4 small text-secondary">{new Date(s.start_time).toLocaleString()}</td>
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

export default EVModule;