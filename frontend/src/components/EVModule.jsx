import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EVModule({ onDataChanged }) {
  const [points, setPoints] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states for new charging session
  const [selectedPointId, setSelectedPointId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [energyKwh, setEnergyKwh] = useState('');

  const fetchEVData = async () => {
    try {
      const [ptsRes, sessRes] = await Promise.all([
        axios.get('http://localhost:5000/api/ev/points'),
        axios.get('http://localhost:5000/api/ev/sessions')
      ]);

      if (ptsRes.data.success) {
        setPoints(ptsRes.data.data);
        if (ptsRes.data.data.length > 0 && !selectedPointId) {
          setSelectedPointId(ptsRes.data.data[0].id);
        }
      }
      if (sessRes.data.success) {
        setSessions(sessRes.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEVData();
  }, []);

  const handleRecordSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/ev/sessions', {
        point_id: parseInt(selectedPointId),
        vehicle_number: vehicleNumber,
        energy_consumed_kwh: parseFloat(energyKwh)
      });
      setStatusMessage({ type: 'success', text: 'Charging session logged successfully!' });
      setVehicleNumber('');
      setEnergyKwh('');
      fetchEVData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to record session' });
    }
  };

  if (loading) return <div>Loading EV Stations...</div>;

  return (
    <div className="container-fluid p-0">
      {statusMessage && (
        <div className={`alert alert-${statusMessage.type} alert-dismissible fade show`} role="alert">
          {statusMessage.text}
          <button type="button" className="btn-close" onClick={() => setStatusMessage(null)}></button>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Active Charging Points Status */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">⚡ Charging Stations (Piliyandala)</div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {points.map(pt => (
                  <div key={pt.id} className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold mb-1">{pt.name}</h6>
                      <span className="badge bg-secondary me-2">{pt.charger_type}</span>
                      <span className="small text-muted">Rs. {Number(pt.rate_per_kwh).toLocaleString()} / kWh</span>
                    </div>
                    <span className="badge bg-success">{pt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Log Charging Session Form */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">🔌 Log Vehicle Charging Session</div>
            <div className="card-body">
              <form onSubmit={handleRecordSession}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Charging Bay</label>
                  <select
                    className="form-select"
                    value={selectedPointId}
                    onChange={e => setSelectedPointId(e.target.value)}
                    required
                  >
                    {points.map(pt => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.charger_type}) — Rs. {Number(pt.rate_per_kwh).toLocaleString()}/kWh
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Vehicle Plate Number</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. WP CBI-5678"
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Energy Delivered (kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      placeholder="e.g. 28.5"
                      value={energyKwh}
                      onChange={e => setEnergyKwh(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">Record Charging & Calculate Fee</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Charging Sessions History Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white fw-bold py-3">📋 Recent Charging Sessions</div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Session ID</th>
                <th>Vehicle No</th>
                <th>Bay</th>
                <th>Energy (kWh)</th>
                <th>Tariff Rate</th>
                <th>Total Billed</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-3 text-muted">No charging sessions recorded yet.</td></tr>
              ) : (
                sessions.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td className="fw-semibold">{s.vehicle_number}</td>
                    <td>{s.charging_point_name}</td>
                    <td><span className="badge bg-info text-dark">{s.energy_consumed_kwh} kWh</span></td>
                    <td>Rs. {Number(s.rate_per_kwh).toLocaleString()}</td>
                    <td className="fw-bold text-success">Rs. {Number(s.total_amount).toLocaleString()}</td>
                    <td className="small text-muted">{new Date(s.start_time).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EVModule;