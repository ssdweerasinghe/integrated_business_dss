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

// Register Chart.js modules
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

  useEffect(() => {
    // Fetch aggregated data from our Node.js DSS API
    axios.get('http://localhost:5000/api/analytics/summary')
      .then((response) => {
        if (response.data && response.data.success) {
          setData(response.data);
        } else {
          setError('Unexpected response format');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching analytics:', err);
        setError('Cannot connect to backend server. Make sure the backend is running on port 5000.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading DSS Dashboard...</span>
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

  // Revenue & Profit Bar Chart configuration
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

  // Revenue Contribution Doughnut Chart configuration
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
      <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-dark m-0">Integrated Business Decision Support System</h2>
          <span className="text-muted">Case Study: Multi-Sector Operations in Piliyandala</span>
        </div>
        <span className="badge bg-success fs-6">System Live</span>
      </header>

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
                    <div key={idx} className={`alert alert-${item.type} mb-0 py-2 d-flex justify-content-between align-items-center`}>
                      <span><strong>[{item.module}]</strong> {item.message}</span>
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
    </div>
  );
}

export default App;