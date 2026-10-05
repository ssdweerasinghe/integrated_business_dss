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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading DSS...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Connection Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { summary, decision_insights } = data;
  const { breakdown } = summary;

  const barChartData = {
    labels: ['Tyre Sales', 'EV Charging', 'Fleet Operations'],
    datasets: [
      {
        label: 'Revenue (LKR)',
        data: [
          parseFloat(breakdown.tyres.revenue),
          parseFloat(breakdown.ev_charging.revenue),
          parseFloat(breakdown.fleet.revenue)
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.75)'
      },
      {
        label: 'Profit (LKR)',
        data: [
          parseFloat(breakdown.tyres.profit),
          parseFloat(breakdown.ev_charging.estimated_profit),
          parseFloat(breakdown.fleet.net_profit)
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.75)'
      }
    ]
  };

  const doughnutData = {
    labels: ['Tyre Sales', 'EV Charging', 'Fleet Operations'],
    datasets: [
      {
        data: [
          parseFloat(breakdown.tyres.revenue),
          parseFloat(breakdown.ev_charging.revenue),
          parseFloat(breakdown.fleet.revenue)
        ],
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FFCE56']
      }
    ]
  };

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header */}
      <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h2 className="fw-bold text-dark m-0">Integrated Business Decision Support System</h2>
          <span className="text-muted">Case Study: Multi-Sector Operations in Piliyandala</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success fs-6">System Live</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => { setActiveTab('dashboard'); fetchAnalytics(); }}
          >
            📊 Executive Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'tyres' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('tyres')}
          >
            🛞 Tyre Inventory & Sales
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'ev' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('ev')}
          >
            ⚡ EV Charging Station
          </button>
        </li>
      </ul>

      {/* Render Active View */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 border-start border-primary border-4">
                <div className="card-body">
                  <span className="text-muted text-uppercase fw-semibold small">Total Revenue</span>
                  <h3 className="fw-bold mt-2">Rs. {Number(summary.total_business_revenue).toLocaleString()}</h3>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 border-start border-success border-4">
                <div className="card-body">
                  <span className="text-muted text-uppercase fw-semibold small">Net Business Profit</span>
                  <h3 className="fw-bold mt-2 text-success">Rs. {Number(summary.total_business_profit).toLocaleString()}</h3>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 border-start border-info border-4">
                <div className="card-body">
                  <span className="text-muted text-uppercase fw-semibold small">EV Delivered Energy</span>
                  <h3 className="fw-bold mt-2">{breakdown.ev_charging.total_kwh || 0} kWh</h3>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 border-start border-warning border-4">
                <div className="card-body">
                  <span className="text-muted text-uppercase fw-semibold small">Fleet Operational Cost</span>
                  <h3 className="fw-bold mt-2 text-warning">Rs. {Number(breakdown.fleet.expenses).toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Support Insights */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white fw-bold py-3">
                  🧠 Automated Decision Support Insights
                </div>
                <div className="card-body">
                  {decision_insights.length === 0 ? (
                    <p className="text-muted m-0">No active operational alerts.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {decision_insights.map((item, idx) => (
                        <div key={idx} className={`alert alert-${item.type} mb-0 py-2`}>
                          <strong>[{item.module}]</strong> {item.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white fw-bold py-3">
                  Sector Comparison: Revenue vs Profit
                </div>
                <div className="card-body" style={{ minHeight: '320px' }}>
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
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white fw-bold py-3">
                  Revenue Distribution
                </div>
                <div className="card-body d-flex justify-content-center align-items-center" style={{ minHeight: '320px' }}>
                  <div style={{ width: '85%' }}>
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { legend: { position: 'bottom' } }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tyres' && (
        <TyreModule onDataChanged={fetchAnalytics} />
      )}

      {activeTab === 'ev' && (
        <EVModule onDataChanged={fetchAnalytics} />
      )}
    </div>
  );
}

export default App;