import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FleetModule({ onDataChanged }) {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Form State: Register Vehicle
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('Active');

  // Form State: Record Trip Earnings
  const [selectedVehicleForTrip, setSelectedVehicleForTrip] = useState('');
  const [tripPlatform, setTripPlatform] = useState('PickMe');
  const [tripGross, setTripGross] = useState('');
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));

  // Form State: Log Operational Expense
  const [selectedVehicleForExp, setSelectedVehicleForExp] = useState('');
  const [expenseType, setExpenseType] = useState('Fuel');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchFleetData = async () => {
    try {
      const [vehRes, adminRes] = await Promise.all([
        axios.get('http://localhost:5000/api/fleet/vehicles'),
        axios.get('http://localhost:5000/api/fleet/admin/records')
      ]);

      if (vehRes.data.success) setVehicles(vehRes.data.data);
      if (adminRes.data.success) {
        setTrips(adminRes.data.trips);
        setExpenses(adminRes.data.expenses);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  // 1. Submit New Vehicle Registration
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!plateNumber || !vehicleModel) return;

    try {
      const res = await axios.post('http://localhost:5000/api/fleet/vehicles', {
        plate_number: plateNumber.trim().toUpperCase(),
        model: vehicleModel.trim(),
        driver_name: assignedDriver.trim() || null,
        status: vehicleStatus
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: `Vehicle ${plateNumber.toUpperCase()} added to fleet successfully!` });
        setPlateNumber('');
        setVehicleModel('');
        setAssignedDriver('');
        setVehicleStatus('Active');
        fetchFleetData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error registering vehicle.'
      });
    }
  };

  // 2. Submit Trip Earnings
  const handleTripSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleForTrip || !tripGross || tripGross <= 0) return;

    try {
      const res = await axios.post('http://localhost:5000/api/fleet/trips', {
        vehicle_id: selectedVehicleForTrip,
        platform: tripPlatform,
        trip_date: tripDate,
        gross_earnings: parseFloat(tripGross)
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Daily ride-hailing earnings recorded!' });
        setTripGross('');
        fetchFleetData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error recording trip.'
      });
    }
  };

  // 3. Submit Operational Expense Voucher
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleForExp || !expenseAmount || expenseAmount <= 0) return;

    try {
      const res = await axios.post('http://localhost:5000/api/fleet/expenses', {
        vehicle_id: selectedVehicleForExp,
        expense_type: expenseType,
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        expense_date: expenseDate
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Fleet expense logged successfully!' });
        setExpenseAmount('');
        setExpenseDesc('');
        fetchFleetData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error logging expense.'
      });
    }
  };

  // Financial Computations
  const totalFleetRevenue = trips.reduce((acc, t) => acc + Number(t.gross_earnings || 0), 0);
  const totalFleetExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const netFleetProfit = totalFleetRevenue - totalFleetExpenses;

  if (loading) {
    return <div className="text-center py-5">Loading Fleet Department Operations...</div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* KPI Cards for Fleet Department */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Gross Fleet Revenue</span>
              <h4 className="fw-bold mt-2">Rs. {totalFleetRevenue.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Operating Expenses</span>
              <h4 className="fw-bold mt-2 text-warning">Rs. {totalFleetExpenses.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Net Fleet Profit</span>
              <h4 className={`fw-bold mt-2 ${netFleetProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                Rs. {netFleetProfit.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card shadow-sm border-0 border-start border-info border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Total Fleet Size</span>
              <h4 className="fw-bold mt-2 text-dark">{vehicles.length} Registered Cars</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Entry Action Cards */}
      <div className="row g-4 mb-4">
        {/* Entry Form 1: Add New Vehicle */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>🚗 Register New Vehicle</span>
              <span className="badge bg-primary">Asset Onboarding</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddVehicle}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">License Plate Number</label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    placeholder="e.g. WP CAA-4590"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Make & Model</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Suzuki Wagon R / Toyota Prius"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Primary Driver Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Nimal Fernando"
                    value={assignedDriver}
                    onChange={(e) => setAssignedDriver(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Operational Status</label>
                  <select
                    className="form-select"
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-outline-primary w-100 fw-semibold">
                  + Add Vehicle to Fleet
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Entry Form 2: Daily Trip Earnings */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>📈 Log Daily Trip Earnings</span>
              <span className="badge bg-success">Revenue</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleTripSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Fleet Vehicle</label>
                  <select
                    className="form-select"
                    value={selectedVehicleForTrip}
                    onChange={(e) => setSelectedVehicleForTrip(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} ({v.model}) - {v.driver_name || 'No driver'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Dispatch Platform</label>
                  <select
                    className="form-select"
                    value={tripPlatform}
                    onChange={(e) => setTripPlatform(e.target.value)}
                  >
                    <option value="PickMe">PickMe</option>
                    <option value="Uber">Uber</option>
                    <option value="Private Hire">Private Hire</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Trip Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Gross Fare Collected (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 14500"
                    value={tripGross}
                    onChange={(e) => setTripGross(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-success w-100 fw-semibold">
                  Record Trip Revenue
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Entry Form 3: Fleet Expense Voucher */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>🧾 Log Operational Expense</span>
              <span className="badge bg-warning text-dark">Overhead</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleExpenseSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Fleet Vehicle</label>
                  <select
                    className="form-select"
                    value={selectedVehicleForExp}
                    onChange={(e) => setSelectedVehicleForExp(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Expense Category</label>
                  <select
                    className="form-select"
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                  >
                    <option value="Fuel">Fuel (Petrol/Diesel)</option>
                    <option value="Maintenance">Maintenance & Service</option>
                    <option value="Insurance">Insurance & Revenue License</option>
                    <option value="Tyre Replacement">Tyre Replacement</option>
                    <option value="Repair">Repairs & Bodywork</option>
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Amount (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-control"
                      placeholder="e.g. 5000"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Expense Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description / Receipt Note</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. IOC Petrol 12.5L fill-up"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-outline-warning w-100 fw-semibold text-dark">
                  Log Expense Voucher
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Roster: Registered Fleet Vehicles */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
          <span>📋 Fleet Vehicle Roster</span>
          <span className="badge bg-secondary">{vehicles.length} Units Available</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Vehicle ID</th>
                  <th>License Plate</th>
                  <th>Make / Model</th>
                  <th>Assigned Driver</th>
                  <th>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No fleet vehicles registered yet. Add a vehicle using the form above.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="fw-semibold">#{v.id}</td>
                      <td>
                        <span className="badge bg-dark fs-6 px-3 py-2 font-monospace">{v.plate_number}</span>
                      </td>
                      <td className="fw-medium">{v.model}</td>
                      <td>{v.driver_name || <span className="text-muted italic">Unassigned</span>}</td>
                      <td>
                        {v.status === 'Active' ? (
                          <span className="badge bg-success">Active Service</span>
                        ) : v.status === 'Maintenance' ? (
                          <span className="badge bg-warning text-dark">In Maintenance</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Operational Logs: Trips & Expenses Grid */}
      <div className="row g-4">
        {/* Recent Trips */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>🚖 Recent Trip Revenues</span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                {trips.length} Trips
              </span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '350px' }}>
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Vehicle</th>
                      <th>Platform</th>
                      <th>Date</th>
                      <th className="text-end">Gross (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-3 text-muted">No trips recorded</td></tr>
                    ) : (
                      trips.map((tr) => (
                        <tr key={tr.id}>
                          <td className="fw-semibold">{tr.plate_number}</td>
                          <td>
                            <span className={`badge ${tr.platform === 'PickMe' ? 'bg-warning text-dark' : 'bg-dark'}`}>
                              {tr.platform}
                            </span>
                          </td>
                          <td className="small text-muted">{tr.trip_date?.substring(0, 10)}</td>
                          <td className="text-end fw-bold text-success">
                            Rs. {Number(tr.gross_earnings).toLocaleString()}
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

        {/* Recent Expenses */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>⛽ Recent Expense Vouchers</span>
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                {expenses.length} Vouchers
              </span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '350px' }}>
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th className="text-end">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-3 text-muted">No expenses recorded</td></tr>
                    ) : (
                      expenses.map((ex) => (
                        <tr key={ex.id}>
                          <td className="fw-semibold">{ex.plate_number}</td>
                          <td><span className="badge bg-secondary">{ex.expense_type}</span></td>
                          <td className="small text-muted">{ex.description || ex.expense_date?.substring(0, 10)}</td>
                          <td className="text-end fw-bold text-danger">
                            -Rs. {Number(ex.amount).toLocaleString()}
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
      </div>
    </div>
  );
}

export default FleetModule;