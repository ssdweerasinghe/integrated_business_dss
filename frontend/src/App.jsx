import React, { useState, useEffect } from 'react';
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

// Define API Base securely (Replaces the broken config import)
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Global Axios Interceptor to automatically attach the JWT token for RBAC routes
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('dss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('dss_theme') || 'light');

  const getAccessibleTabs = (role) => {
    switch (role) {
      case 'Admin':
        return ['dashboard', 'tyres', 'ev', 'fleet', 'admin'];
      case 'Owner':
        return ['dashboard', 'tyres', 'ev', 'fleet'];
      case 'Shop Manager':
        return ['tyres'];
      case 'EV Operator':
      case 'EV System Manager':
      case 'EV Manager':
        return ['ev'];
      case 'Fleet Manager':
      case 'Fleet Operation Manager':
        return ['fleet'];
      default:
        return ['dashboard'];
    }
  };

  const accessibleTabs = currentUser ? getAccessibleTabs(currentUser.role) : [];

  // Handle Theme Toggling
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('dss_theme', theme);
  }, [theme]);

  // Restore authenticated session
  useEffect(() => {
    const savedUser = localStorage.getItem('dss_user');
    const token = localStorage.getItem('dss_token');
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('dss_user');
        localStorage.removeItem('dss_token');
      }
    }
  }, []);

  const fetchAnalytics = () => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/api/analytics/summary`)
      .then((response) => {
        if (response.data && response.data.success) {
          setData(response.data);
        } else {
          setError(response.data?.message || 'Unable to parse executive metrics.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Analytics Error:', err);
        setError('Cannot connect to backend server. Verify that the backend service is running and accessible.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const allowed = getAccessibleTabs(currentUser.role);
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'dashboard');
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('dss_token');
    localStorage.removeItem('dss_user');
    setCurrentUser(null);
    setData(null);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Visual chart configurations
  const barChartData = {
    labels: ['Tyre Division', 'EV Charging Hub', 'Fleet Mobility'],
    datasets: [
      {
        label: 'Gross Turnover (LKR)',
        data: [
          data?.summary?.breakdown?.tyres?.revenue || 0,
          data?.summary?.breakdown?.ev_charging?.revenue || 0,
          data?.summary?.breakdown?.fleet?.revenue || 0
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderRadius: 8
      },
      {
        label: 'Net Contribution Margin (LKR)',
        data: [
          data?.summary?.breakdown?.tyres?.profit || 0,
          data?.summary?.breakdown?.ev_charging?.estimated_profit || 0,
          data?.summary?.breakdown?.fleet?.net_profit || 0
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderRadius: 8
      }
    ]
  };

  const doughnutData = {
    labels: ['Tyre Sales', 'EV Charging', 'Fleet Trips'],
    datasets: [
      {
        data: [
          data?.summary?.breakdown?.tyres?.revenue || 1,
          data?.summary?.breakdown?.ev_charging?.revenue || 1,
          data?.summary?.breakdown?.fleet?.revenue || 1
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.85)',
          'rgba(255, 206, 86, 0.85)',
          'rgba(75, 192, 192, 0.85)'
        ],
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 px-md-4 shadow-sm">
        <div className="container-fluid p-0">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0">
            <span className="p-1 px-2 rounded bg-primary text-white fs-6">⚡</span>
            <span>Integrated Business DSS</span>
          </span>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-light btn-sm rounded-pill px-3"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
            <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={handlePrintReport}>
              🖨️ Print
            </button>
            <div className="text-end text-light d-none d-sm-block">
              <small className="d-block text-secondary lh-1">Operator Profile</small>
              <span className="fw-semibold small">{currentUser.name || currentUser.username}</span>
              <span className="badge bg-secondary ms-2 small">{currentUser.role}</span>
            </div>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container-fluid py-4 px-3 px-md-4">
        {/* Module Selection Navigation */}
        <ul className="nav nav-pills gap-2 mb-4 p-2 bg-white rounded-4 shadow-sm border">
          {accessibleTabs.includes('dashboard') && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-2 fw-semibold ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Executive Dashboard
              </button>
            </li>
          )}
          {accessibleTabs.includes('tyres') && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-2 fw-semibold ${activeTab === 'tyres' ? 'active' : ''}`}
                onClick={() => setActiveTab('tyres')}
              >
                🛞 Tyre Inventory & Sales
              </button>
            </li>
          )}
          {accessibleTabs.includes('ev') && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-2 fw-semibold ${activeTab === 'ev' ? 'active' : ''}`}
                onClick={() => setActiveTab('ev')}
              >
                ⚡ EV Charging Station
              </button>
            </li>
          )}
          {accessibleTabs.includes('fleet') && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-2 fw-semibold ${activeTab === 'fleet' ? 'active' : ''}`}
                onClick={() => setActiveTab('fleet')}
              >
                🚗 Fleet Operations
              </button>
            </li>
          )}
          {accessibleTabs.includes('admin') && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-2 fw-semibold text-danger ${activeTab === 'admin' ? 'active bg-danger text-white' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                🛡️ Admin Data Manager
              </button>
            </li>
          )}
        </ul>

        {/* Tab Route Switching */}
        {activeTab === 'tyres' && <TyreModule currentUser={currentUser} onDataChanged={fetchAnalytics} />}
        {activeTab === 'ev' && <EVModule currentUser={currentUser} onDataChanged={fetchAnalytics} />}
        {activeTab === 'fleet' && <FleetModule currentUser={currentUser} onDataChanged={fetchAnalytics} />}
        {activeTab === 'admin' && currentUser.role === 'Admin' && <AdminManager onDataChanged={fetchAnalytics} />}

        {activeTab === 'dashboard' && (
          <div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading Executive DSS...</span>
                </div>
              </div>
            ) : error ? (
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 border-start border-4 border-danger bg-danger-subtle text-danger-emphasis">
                <h5 className="fw-bold m-0 mb-1">Connection Error</h5>
                <p className="m-0 small">{error}</p>
                <button className="btn btn-danger btn-sm rounded-pill mt-3 px-3 align-self-start" onClick={fetchAnalytics}>
                  Retry Connection
                </button>
              </div>
            ) : (
              <div>
                {/* Strategic KPI Metric Strip */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <small className="text-secondary fw-semibold">Total Turnover</small>
                      <h3 className="fw-bolder text-primary m-0 mt-1">
                        Rs. {Number(data?.summary?.total_business_revenue || 0).toLocaleString()}
                      </h3>
                      <small className="text-success mt-2">Combined operations turnover</small>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <small className="text-secondary fw-semibold">Net Business Profit</small>
                      <h3 className="fw-bolder text-success m-0 mt-1">
                        Rs. {Number(data?.summary?.total_business_profit || 0).toLocaleString()}
                      </h3>
                      <small className="text-secondary mt-2">Net retention margin</small>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <small className="text-secondary fw-semibold">Clean Energy Delivered</small>
                      <h3 className="fw-bolder text-info m-0 mt-1">
                        {Number(data?.summary?.breakdown?.ev_charging?.total_kwh || 0).toFixed(1)} kWh
                      </h3>
                      <small className="text-secondary mt-2">Active charging hub throughput</small>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <small className="text-secondary fw-semibold">Fleet Operating Burn</small>
                      <h3 className="fw-bolder text-danger m-0 mt-1">
                        Rs. {Number(data?.summary?.breakdown?.fleet?.expenses || 0).toLocaleString()}
                      </h3>
                      <small className="text-secondary mt-2">Fuel and scheduled maintenance</small>
                    </div>
                  </div>
                </div>

                {/* Charts View */}
                <div className="row g-4 mb-4">
                  <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                      <h6 className="fw-bold mb-3">Turnover vs. Contribution Margin</h6>
                      <div style={{ minHeight: '300px' }}>
                        <Bar
                          data={barChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'top' } }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                      <h6 className="fw-bold mb-3">Revenue Mix by Sector</h6>
                      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                        <Doughnut
                          data={doughnutData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DSS Strategic Recommendations */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold mb-3">Automated Strategic Decision Heuristics</h6>
                  <div className="d-flex flex-column gap-2">
                    {data?.decision_insights?.length > 0 ? (
                      data.decision_insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`alert alert-${insight.type || 'info'} py-2 px-3 m-0 rounded-3 small d-flex align-items-center gap-2`}
                        >
                          <span className="fw-bold">[{insight.module}]</span>
                          <span>{insight.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-secondary small">Operational heuristics will generate automatically as volume grows.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;