import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function EVModule({ onDataChanged }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Bay Form State
  const [bayName, setBayName] = useState('');
  const [chargerType, setChargerType] = useState('DC Fast CCS2');
  const [ratePerKwh, setRatePerKwh] = useState('120.00');

  // Charging Session Drawer/Modal State
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [energyConsumed, setEnergyConsumed] = useState('');
  const [sessionMsg, setSessionMsg] = useState(null);

  const fetchPoints = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ev/points`);
      if (res.data?.success) {
        setPoints(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch EV charging bays.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleAddPoint = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/ev/points`, {
        name: bayName.trim(),
        charger_type: chargerType,
        rate_per_kwh: parseFloat(ratePerKwh)
      });

      if (res.data?.success) {
        setBayName('');
        fetchPoints();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('Error creating bay: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRecordSession = async (e) => {
    e.preventDefault();
    if (!selectedPoint) return;

    try {
      const kwh = parseFloat(energyConsumed);
      const rate = parseFloat(selectedPoint.rate_per_kwh);
      const total = kwh * rate;

      const res = await axios.post(`${API_BASE}/api/ev/sessions`, {
        point_id: selectedPoint.id,
        vehicle_number: vehicleNumber.trim() || 'Unregistered',
        energy_consumed_kwh: kwh,
        rate_per_kwh: rate,
        total_amount: total
      });

      if (res.data?.success) {
        setSessionMsg('Charging session billed successfully!');
        setVehicleNumber('');
        setEnergyConsumed('');
        fetchPoints();
        if (onDataChanged) onDataChanged();
        setTimeout(() => {
          setSelectedPoint(null);
          setSessionMsg(null);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setSessionMsg(err.response?.data?.message || 'Error recording session.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading EV Bays...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <span className="badge bg-info-subtle text-info-emphasis px-2 py-1 rounded-pill fw-semibold">
            Clean Energy & Infrastructure
          </span>
          <h4 className="fw-bolder m-0 mt-1">EV Charging Bay Command</h4>
        </div>
        <button className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold" onClick={fetchPoints}>
          🔄 Refresh Bays
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-3">{error}</div>}

      <div className="row g-4 mb-4">
        {/* Charging Points Grid */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header py-3 px-4 border-bottom bg-body d-flex justify-content-between align-items-center">
              <h6 className="fw-bold m-0">Charging Bays Network</h6>
              <span className="badge bg-secondary rounded-pill">{points.length} Bays Active</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">Bay Name</th>
                      <th>Charger Protocol</th>
                      <th>Tariff Rate</th>
                      <th>Current Status</th>
                      <th className="pe-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-secondary">
                          No charging bays installed.
                        </td>
                      </tr>
                    ) : (
                      points.map((p) => (
                        <tr key={p.id}>
                          <td className="ps-4">
                            <div className="fw-bold">{p.name}</div>
                            <small className="text-secondary">Bay #{p.id}</small>
                          </td>
                          <td><code>{p.charger_type}</code></td>
                          <td className="fw-semibold text-primary">Rs. {Number(p.rate_per_kwh).toFixed(2)} / kWh</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                p.status === 'Available'
                                  ? 'bg-success-subtle text-success'
                                  : 'bg-warning-subtle text-warning-emphasis'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="pe-4 text-center">
                            <button
                              className="btn btn-info btn-sm rounded-pill px-3 fw-semibold text-white"
                              onClick={() => setSelectedPoint(p)}
                            >
                              Start Charge
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

        {/* Provision Bay Form */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3">Install / Register Charging Bay</h6>
            <form onSubmit={handleAddPoint} className="d-flex flex-column gap-2">
              <div>
                <label className="form-label small fw-semibold text-secondary">Bay Designation</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. Bay 4 - High Power DC"
                  value={bayName}
                  onChange={(e) => setBayName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Charger Standard</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={chargerType}
                  onChange={(e) => setChargerType(e.target.value)}
                >
                  <option value="DC Fast CCS2">DC Fast CCS2 (150kW)</option>
                  <option value="CHAdeMO">CHAdeMO (50kW)</option>
                  <option value="AC Type 2">AC Type 2 (22kW)</option>
                  <option value="GB/T">GB/T Fast Bay</option>
                </select>
              </div>

              <div>
                <label className="form-label small fw-semibold text-secondary">Unit Tariff Rate (Rs. / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm rounded-3"
                  value={ratePerKwh}
                  onChange={(e) => setRatePerKwh(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-info btn-sm rounded-pill fw-semibold text-white mt-2 py-2">
                Save Charging Point
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Charge Session Drawer */}
      {selectedPoint && (
        <div className="card border-0 shadow-lg rounded-4 p-4 mb-4 border-start border-4 border-info">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold m-0 text-info-emphasis">
              Authorize Session: {selectedPoint.name} ({selectedPoint.rate_per_kwh} Rs/kWh)
            </h6>
            <button className="btn btn-close btn-sm" onClick={() => setSelectedPoint(null)}></button>
          </div>

          {sessionMsg && (
            <div className={`alert py-2 small ${sessionMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>
              {sessionMsg}
            </div>
          )}

          <form onSubmit={handleRecordSession} className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary">Vehicle License Number</label>
              <input
                type="text"
                className="form-control form-control-sm rounded-3"
                placeholder="WP CBI-5678"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary">Delivered Energy (kWh)</label>
              <input
                type="number"
                step="0.01"
                className="form-control form-control-sm rounded-3"
                placeholder="e.g. 28.5"
                value={energyConsumed}
                onChange={(e) => setEnergyConsumed(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-info btn-sm rounded-pill px-4 fw-semibold text-white w-100">
                Complete & Bill Session
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={() => setSelectedPoint(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default EVModule;