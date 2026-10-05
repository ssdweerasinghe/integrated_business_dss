import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import TyreModule from './components/TyreModule';
import EVModule from './components/EVModule';
import FleetModule from './components/FleetModule';
import AdminManager from './components/AdminManager';
import Login from './components/Login';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dss_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dss_theme') || 'light';
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [electrifiedUnits, setElectrifiedUnits] = useState(3);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('dss_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const role = user?.role || '';

  // Access definitions
  const isAdmin = role === 'Admin';
  const isOwner = role === 'Owner';
  const isShopManager = role === 'Shop Manager';
  const isEVOperator = role === 'EV Operator';
  const isEVManager = role === 'EV System Manager';
  const isFleetManager = role === 'Fleet Manager' || role === 'Fleet Operation Manager';
  const isDriver = role === 'Driver';

  const canViewDashboard = isAdmin || isOwner;
  const canViewTyres = isAdmin || isOwner || isShopManager;
  const canViewEV = isAdmin || isOwner || isEVManager || isEVOperator;
  const canViewFleet = isAdmin || isOwner || isFleetManager || isDriver;

  useEffect(() => {
    if (user) {
      if (isShopManager) {
        setActiveTab('tyres');
      } else if (isEVOperator || isEVManager) {
        setActiveTab('ev');
      } else if (isDriver || isFleetManager) {
        setActiveTab('fleet');
      } else if (isAdmin) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [user]);

  const fetchAnalytics = () => {
    axios.get('http://localhost:5000/api/analytics/summary')
      .then((response) => {
        if (response.data && response.data.success) {
          setData(response.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Cannot connect to backend server. Ensure backend is running on port 5000.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user && canViewDashboard) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user, canViewDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('dss_token');
    localStorage.removeItem('dss_user');
    setUser(null);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading DSS...</span>
        </div>
      </div>
    );
  }

  if (error && canViewDashboard) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Connection Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { summary, decision_insights } = data || { summary: null, decision_insights: [] };
  const breakdown = summary?.breakdown;

  const tyreRev = parseFloat(breakdown?.tyres?.revenue || 0);
  const tyreProf = parseFloat(breakdown?.tyres?.profit || 0);
  const evRev = parseFloat(breakdown?.ev_charging?.revenue || 0);
  const evProf = parseFloat(breakdown?.ev_charging?.estimated_profit || 0);
  const evKwh = parseFloat(breakdown?.ev_charging?.total_kwh || 0);
  const fleetRev = parseFloat(breakdown?.fleet?.revenue || 0);
  const fleetProf = parseFloat(breakdown?.fleet?.net_profit || 0);
  const fleetExp = parseFloat(breakdown?.fleet?.expenses || 0);

  const totalRev = parseFloat(summary?.total_business_revenue || 0);
  const totalProf = parseFloat(summary?.total_business_profit || 0);

  const grossMarginPct = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : 0;
  const tyreMarginPct = tyreRev > 0 ? ((tyreProf / tyreRev) * 100).toFixed(1) : 0;
  const evMarginPct = evRev > 0 ? ((evProf / evRev) * 100).toFixed(1) : 0;
  const fleetMarginPct = fleetRev > 0 ? ((fleetProf / fleetRev) * 100).toFixed(1) : 0;

  const monthlySavingsPerCar = 30000;
  const projectedMonthlySavings = electrifiedUnits * monthlySavingsPerCar;
  const projectedAnnualSavings = projectedMonthlySavings * 12;

  const isDark = theme === 'dark';
  const textColor = isDark ? '#E2E8F0' : '#1E293B';
  const gridColor = isDark ? '#1F2937' : '#F1F5F9';

  const barChartData = {
    labels: ['Tyre Division', 'EV Charging Bay', 'Fleet Mobility'],
    datasets: [
      {
        label: 'Gross Revenue (LKR)',
        data: [tyreRev, evRev, fleetRev],
        backgroundColor: isDark ? '#60A5FA' : '#1E293B',
        borderRadius: 8,
        barThickness: 28
      },
      {
        label: 'Net Profit (LKR)',
        data: [tyreProf, evProf, fleetProf],
        backgroundColor: '#10B981',
        borderRadius: 8,
        barThickness: 28
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { family: 'Inter, system-ui, sans-serif', weight: '600' } }
      },
      tooltip: {
        backgroundColor: isDark ? '#0F172A' : '#1E293B',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10
      }
    },
    scales: {
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, callback: (val) => `Rs. ${(val / 1000).toFixed(0)}k` }
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor }
      }
    }
  };

  const doughnutData = {
    labels: ['Tyre Division', 'EV Charging', 'Fleet Operations'],
    datasets: [
      {
        data: [tyreRev || 1, evRev || 1, fleetRev || 1],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#FFFFFF',
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: textColor, boxWidth: 12, padding: 15, font: { weight: '500' } }
      }
    }
  };

  return (
    <div className="container-fluid py-3 px-3 px-md-4 min-vh-100">
      {/* ============================================================ */}
      {/* MODERN GLASS INTEGRATED EXECUTIVE NAVBAR                     */}
      {/* ============================================================ */}
      <nav className="modern-glass-navbar rounded-4 px-3 px-md-4 py-3 mb-4 sticky-top">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Brand & Live Status */}
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 bg-primary text-white fs-4 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '44px', height: '44px' }}>
              ⚡
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bolder m-0 text-truncate" style={{ letterSpacing: '-0.3px' }}>
                  Integrated Business DSS
                </h5>
                <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 small fw-semibold">
                  v2.4
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 mt-1 small text-secondary">
                <span className="system-status-indicator"></span>
                <span>Piliyandala Multi-Sector Hub Online</span>
              </div>
            </div>
          </div>

          {/* User Profile, Theme & Action Group */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {canViewDashboard && (
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-none d-sm-inline-flex align-items-center gap-1"
                onClick={handlePrintReport}
              >
                🖨️ <span>Export</span>
              </button>
            )}

            <button
              className={`btn btn-sm ${isDark ? 'btn-light text-dark' : 'btn-dark text-white'} rounded-pill px-3 shadow-sm d-flex align-items-center gap-1`}
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* Profile Micro-Card */}
            <div className="d-flex align-items-center gap-2 ps-2 border-start">
              <div className="user-avatar-badge">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="d-none d-md-block text-end">
                <div className="fw-bold small text-truncate" style={{ maxWidth: '140px' }}>
                  {user.name}
                </div>
                <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-0" style={{ fontSize: '0.68rem' }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              className="btn btn-outline-danger btn-sm rounded-pill px-3 shadow-sm"
              onClick={handleLogout}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dynamic Route Tabs Bar */}
        <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
          {canViewDashboard && (
            <button
              className={`modern-nav-btn ${activeTab === 'dashboard' ? 'active-primary' : ''}`}
              onClick={() => { setActiveTab('dashboard'); fetchAnalytics(); }}
            >
              📊 Executive Dashboard
            </button>
          )}

          {canViewTyres && (
            <button
              className={`modern-nav-btn ${activeTab === 'tyres' ? 'active-primary' : ''}`}
              onClick={() => setActiveTab('tyres')}
            >
              🛞 Tyre Inventory & Sales
            </button>
          )}

          {canViewEV && (
            <button
              className={`modern-nav-btn ${activeTab === 'ev' ? 'active-primary' : ''}`}
              onClick={() => setActiveTab('ev')}
            >
              ⚡ EV Charging Station
            </button>
          )}

          {canViewFleet && (
            <button
              className={`modern-nav-btn ${activeTab === 'fleet' ? 'active-primary' : ''}`}
              onClick={() => setActiveTab('fleet')}
            >
              🚗 Fleet Operations
            </button>
          )}

          {isAdmin && (
            <button
              className={`modern-nav-btn ${activeTab === 'admin' ? 'active-danger' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              🛡️ Admin Data Manager
            </button>
          )}
        </div>
      </nav>

      {/* ============================================================ */}
      {/* TAB 1: EXECUTIVE DASHBOARD (Owner & Admin)                    */}
      {/* ============================================================ */}
      {activeTab === 'dashboard' && canViewDashboard && summary && (
        <div className="pb-4">
          {/* Action Row */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill fw-semibold">
                  Live DSS Telemetry
                </span>
                <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill">
                  Piliyandala Operations Hub
                </span>
              </div>
              <h4 className="fw-bolder m-0 mt-1">Multi-Sector Executive Command Center</h4>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm px-3 fw-semibold shadow-sm rounded-pill" onClick={fetchAnalytics}>
                🔄 Refresh Metrics
              </button>
              <button className="btn btn-dark btn-sm px-3 fw-semibold shadow-sm rounded-pill" onClick={handlePrintReport}>
                📄 Board Report PDF
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-top border-4 border-primary">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="text-secondary fw-semibold text-uppercase small">Total Turnover</span>
                  <span className="badge bg-primary-subtle text-primary rounded-pill px-2">Consolidated</span>
                </div>
                <h2 className="fw-bolder my-2">Rs. {Number(totalRev).toLocaleString()}</h2>
                <div className="small text-secondary mt-auto">
                  <span className="text-success fw-bold">↑ Active</span> across 3 core sectors
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-top border-4 border-success">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="text-secondary fw-semibold text-uppercase small">Net Business Profit</span>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2">
                    {grossMarginPct}% Margin
                  </span>
                </div>
                <h2 className="fw-bolder text-success my-2">Rs. {Number(totalProf).toLocaleString()}</h2>
                <div className="small text-secondary mt-auto">Net return after operational burn</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-top border-4 border-info">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="text-secondary fw-semibold text-uppercase small">Clean Energy Delivered</span>
                  <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-2">EV Station</span>
                </div>
                <h2 className="fw-bolder my-2">
                  {evKwh.toLocaleString()} <span className="fs-5 text-secondary fw-normal">kWh</span>
                </h2>
                <div className="small text-secondary mt-auto">
                  Tariff Margin: <strong>{evMarginPct}%</strong>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3 border-top border-4 border-warning">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="text-secondary fw-semibold text-uppercase small">Fleet Operating Burn</span>
                  <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2">Expenses</span>
                </div>
                <h2 className="fw-bolder text-warning my-2">Rs. {Number(fleetExp).toLocaleString()}</h2>
                <div className="small text-secondary mt-auto">
                  Net Fleet Margin: <strong>{fleetMarginPct}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Efficiency Scorecard */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div className="card-header py-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-body">
              <div>
                <h6 className="fw-bold m-0">Operational Breakdown & Sector Margins</h6>
                <small className="text-secondary">Unit profitability and capital allocation metrics</small>
              </div>
              <span className="badge bg-secondary rounded-pill">Audited Realtime</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary text-uppercase small">
                    <tr>
                      <th className="ps-4">Sector Division</th>
                      <th>Revenue (LKR)</th>
                      <th>Profit / Contribution</th>
                      <th style={{ width: '22%' }}>Profit Margin</th>
                      <th>Share of Revenue</th>
                      <th className="pe-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">🛞</span>
                          <div>
                            <div className="fw-bold">Tyre Inventory & Sales</div>
                            <small className="text-secondary">Retail & Commercial Sales</small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">Rs. {tyreRev.toLocaleString()}</td>
                      <td className="text-success fw-bold">+Rs. {tyreProf.toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small">{tyreMarginPct}%</span>
                          <div className="progress flex-grow-1" style={{ height: '7px' }}>
                            <div className="progress-bar bg-primary rounded" style={{ width: `${Math.min(tyreMarginPct, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">{totalRev > 0 ? ((tyreRev / totalRev) * 100).toFixed(1) : 0}%</td>
                      <td className="pe-4 text-center">
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                          High Liquidity
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">⚡</span>
                          <div>
                            <div className="fw-bold">EV Charging Hub</div>
                            <small className="text-secondary">Fast & Commercial Bays</small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">Rs. {evRev.toLocaleString()}</td>
                      <td className="text-success fw-bold">+Rs. {evProf.toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small">{evMarginPct}%</span>
                          <div className="progress flex-grow-1" style={{ height: '7px' }}>
                            <div className="progress-bar bg-success rounded" style={{ width: `${Math.min(evMarginPct, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">{totalRev > 0 ? ((evRev / totalRev) * 100).toFixed(1) : 0}%</td>
                      <td className="pe-4 text-center">
                        <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-3">
                          High Efficiency
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">🚗</span>
                          <div>
                            <div className="fw-bold">Fleet Operations</div>
                            <small className="text-secondary">PickMe / Uber Mobility</small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">Rs. {fleetRev.toLocaleString()}</td>
                      <td className={`fw-bold ${fleetProf >= 0 ? 'text-success' : 'text-danger'}`}>
                        {fleetProf >= 0 ? '+' : ''}Rs. {fleetProf.toLocaleString()}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small">{fleetMarginPct}%</span>
                          <div className="progress flex-grow-1" style={{ height: '7px' }}>
                            <div className="progress-bar bg-warning rounded" style={{ width: `${Math.min(Math.max(fleetMarginPct, 0), 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">{totalRev > 0 ? ((fleetRev / totalRev) * 100).toFixed(1) : 0}%</td>
                      <td className="pe-4 text-center">
                        {fleetExp > evProf ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3">
                            Fuel Sensitive
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                            Profitable
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Directives & What-If Simulator */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header py-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-body">
                  <div>
                    <h6 className="fw-bold m-0">Automated Strategic Directives</h6>
                    <small className="text-secondary">Heuristic rules & anomaly alerts</small>
                  </div>
                  <span className="badge bg-primary rounded-pill">AI Engine</span>
                </div>
                <div className="card-body p-4">
                  {(!decision_insights || decision_insights.length === 0) ? (
                    <div className="text-center py-4 text-secondary">
                      <div className="fs-1">✅</div>
                      <div className="fw-semibold mt-2">All sectors within healthy baseline targets.</div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {decision_insights.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-3 border-start border-4 ${
                            item.type === 'danger'
                              ? 'bg-danger-subtle border-danger text-danger-emphasis'
                              : item.type === 'warning'
                              ? 'bg-warning-subtle border-warning text-warning-emphasis'
                              : 'bg-info-subtle border-info text-info-emphasis'
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bolder small text-uppercase">
                              [{item.module}]
                            </span>
                            <span className="badge bg-dark rounded-pill" style={{ fontSize: '0.65rem' }}>
                              ACTION REQUIRED
                            </span>
                          </div>
                          <div className="small fw-medium">{item.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header py-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-body">
                  <div>
                    <h6 className="fw-bold m-0">What-If Electrification Simulator</h6>
                    <small className="text-secondary">Projected capital gains from ICE-to-EV fleet conversion</small>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                    Cost Synergies
                  </span>
                </div>
                <div className="card-body p-4">
                  <label className="form-label d-flex justify-content-between fw-semibold small text-secondary">
                    <span>Select fleet vehicles to convert to EV:</span>
                    <span className="badge bg-primary fs-6">{electrifiedUnits} Vehicles</span>
                  </label>
                  <input
                    type="range"
                    className="form-range my-2"
                    min="1"
                    max="10"
                    value={electrifiedUnits}
                    onChange={(e) => setElectrifiedUnits(parseInt(e.target.value))}
                  />

                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <div className="p-3 bg-body-secondary rounded-3 border text-center">
                        <span className="text-secondary small fw-semibold">Monthly Fuel Saved</span>
                        <h4 className="fw-bold text-success mt-1 mb-0">
                          Rs. {projectedMonthlySavings.toLocaleString()}
                        </h4>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-body-secondary rounded-3 border text-center">
                        <span className="text-secondary small fw-semibold">Annual Retained Profit</span>
                        <h4 className="fw-bold text-primary mt-1 mb-0">
                          Rs. {projectedAnnualSavings.toLocaleString()}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 mt-3 bg-body-secondary rounded-3 border small text-secondary">
                    💡 <strong>Decision Rationale:</strong> Shifting high-mileage ride-hailing units to internal off-peak EV charging captures fuel margins directly into station revenues, raising fleet operating margins by up to <strong>28%</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Analytics Canvas Grid */}
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header py-3 px-4 border-bottom bg-body">
                  <h6 className="fw-bold m-0">Sector Performance: Revenue vs Net Profit</h6>
                </div>
                <div className="card-body p-4" style={{ height: '340px' }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header py-3 px-4 border-bottom bg-body">
                  <h6 className="fw-bold m-0">Consolidated Revenue Share</h6>
                </div>
                <div className="card-body p-4 d-flex justify-content-center align-items-center" style={{ height: '340px' }}>
                  <div style={{ width: '90%', height: '100%' }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* OTHER MODULE TABS                                            */}
      {/* ============================================================ */}
      {activeTab === 'tyres' && canViewTyres && (
        <TyreModule onDataChanged={fetchAnalytics} />
      )}

      {activeTab === 'ev' && canViewEV && (
        <EVModule onDataChanged={fetchAnalytics} />
      )}

      {activeTab === 'fleet' && canViewFleet && (
        <FleetModule onDataChanged={fetchAnalytics} />
      )}

      {activeTab === 'admin' && isAdmin && (
        <AdminManager onDataChanged={fetchAnalytics} />
      )}
    </div>
  );
}

export default App;