import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TyreModule({ onDataChanged }) {
  const [tyres, setTyres] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTyreId, setSelectedTyreId] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [customerName, setCustomerName] = useState('');

  // Add stock state
  const [newBrand, setNewBrand] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newBuyingPrice, setNewBuyingPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newStockQty, setNewStockQty] = useState('');

  const [message, setMessage] = useState(null);

  const fetchTyreData = async () => {
    try {
      const [tyresRes, salesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tyres'),
        axios.get('http://localhost:5000/api/tyres/sales/history')
      ]);

      if (tyresRes.data.success) setTyres(tyresRes.data.data);
      if (salesRes.data.success) setSalesHistory(salesRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyreData();
  }, []);

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTyreId || saleQty <= 0) return;

    try {
      const res = await axios.post('http://localhost:5000/api/tyres/sale', {
        tyre_id: selectedTyreId,
        quantity_sold: parseInt(saleQty),
        customer_name: customerName || 'Walk-in Customer'
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'POS Sale recorded successfully!' });
        setCustomerName('');
        setSaleQty(1);
        fetchTyreData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error processing sale.'
      });
    }
  };

  const handleAddTyre = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/tyres', {
        brand: newBrand,
        pattern: newPattern,
        size: newSize,
        buying_price: parseFloat(newBuyingPrice),
        selling_price: parseFloat(newSellingPrice),
        stock_quantity: parseInt(newStockQty)
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'New tyre added to stock catalog!' });
        setNewBrand('');
        setNewPattern('');
        setNewSize('');
        setNewBuyingPrice('');
        setNewSellingPrice('');
        setNewStockQty('');
        fetchTyreData();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error adding tyre.'
      });
    }
  };

  // Compute total profit across all sales
  const totalSalesRevenue = salesHistory.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const totalSalesProfit = salesHistory.reduce((acc, s) => acc + Number(s.gross_profit || 0), 0);

  if (loading) {
    return <div className="text-center py-5">Loading Tyre Department...</div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* KPI Cards for Tyre Department */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-primary border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Total Tyre Revenue</span>
              <h4 className="fw-bold mt-2">Rs. {totalSalesRevenue.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-success border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Total Gross Profit Earned</span>
              <h4 className="fw-bold mt-2 text-success">Rs. {totalSalesProfit.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 border-start border-info border-4">
            <div className="card-body">
              <span className="text-muted text-uppercase fw-semibold small">Active Stock Models</span>
              <h4 className="fw-bold mt-2">{tyres.length} SKUs</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* POS Sale Form */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">
              🧾 Record Tyre POS Sale
            </div>
            <div className="card-body">
              <form onSubmit={handleSaleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Customer Name / Vehicle No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kasun Perera (WP CAB-2041)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Tyre Model</label>
                  <select
                    className="form-select"
                    value={selectedTyreId}
                    onChange={(e) => setSelectedTyreId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Tyre --</option>
                    {tyres.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.stock_quantity <= 0}>
                        {t.brand} {t.pattern} ({t.size}) - Rs. {Number(t.selling_price).toLocaleString()} | Stock: {t.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={saleQty}
                    onChange={(e) => setSaleQty(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-semibold">
                  Complete POS Transaction
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Ingest New Stock Form */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">
              📦 Ingest New Tyre Inventory
            </div>
            <div className="card-body">
              <form onSubmit={handleAddTyre}>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dunlop / Michelin"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tread Pattern</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. SP Sport LM705"
                      value={newPattern}
                      onChange={(e) => setNewPattern(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Size</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 195/65R15"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Buying Cost (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 18000"
                      value={newBuyingPrice}
                      onChange={(e) => setNewBuyingPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Selling Price (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 22500"
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 12"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-outline-success w-100 fw-semibold">
                  Add to Tyre Inventory
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* SOLD DETAILS & PROFIT AUDIT TABLE */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
          <span>📋 Sold Tyre Details & Profit Analysis</span>
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            {salesHistory.length} Transactions Logged
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Sale ID</th>
                  <th>Customer Name</th>
                  <th>Tyre Details</th>
                  <th>Qty</th>
                  <th>Unit Buying Price</th>
                  <th>Unit Selling Price</th>
                  <th>Total Billed</th>
                  <th>Gross Profit</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      No tyre sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  salesHistory.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-semibold">#{s.id}</td>
                      <td>
                        <span className="fw-medium">{s.customer_name}</span>
                      </td>
                      <td>
                        <strong>{s.brand}</strong> {s.pattern} <span className="badge bg-secondary ms-1">{s.size}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary rounded-pill px-2">{s.quantity_sold}</span>
                      </td>
                      <td className="text-muted">Rs. {Number(s.buying_price).toLocaleString()}</td>
                      <td>Rs. {Number(s.unit_price).toLocaleString()}</td>
                      <td className="fw-bold">Rs. {Number(s.total_amount).toLocaleString()}</td>
                      <td className="fw-bold text-success">
                        +Rs. {Number(s.gross_profit).toLocaleString()}
                      </td>
                      <td className="small text-muted">
                        {new Date(s.sale_date).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CURRENT INVENTORY CATALOG */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white fw-bold py-3">
          🏬 Current In-Stock Inventory
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Brand & Model</th>
                  <th>Size</th>
                  <th>Buying Cost</th>
                  <th>Selling Price</th>
                  <th>Unit Margin</th>
                  <th>Stock Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tyres.map((t) => {
                  const unitMargin = t.selling_price - t.buying_price;
                  const isLow = t.stock_quantity < 5;
                  return (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td className="fw-semibold">{t.brand} {t.pattern}</td>
                      <td><span className="badge bg-dark">{t.size}</span></td>
                      <td>Rs. {Number(t.buying_price).toLocaleString()}</td>
                      <td>Rs. {Number(t.selling_price).toLocaleString()}</td>
                      <td className="text-success fw-semibold">+Rs. {Number(unitMargin).toLocaleString()}</td>
                      <td className="fw-bold">{t.stock_quantity}</td>
                      <td>
                        {isLow ? (
                          <span className="badge bg-danger">Low Stock Alert</span>
                        ) : (
                          <span className="badge bg-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TyreModule;