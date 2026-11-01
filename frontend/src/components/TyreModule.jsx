import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function TyreModule({ onDataChanged }) {
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Tyre Form State
  const [brand, setBrand] = useState('');
  const [pattern, setPattern] = useState('');
  const [size, setSize] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  // Sale Modal State
  const [selectedTyre, setSelectedTyre] = useState(null);
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState('');
  const [saleMsg, setSaleMsg] = useState(null);

  const fetchTyres = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tyres`);
      if (res.data?.success) {
        setTyres(res.data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tyre inventory.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
  }, []);

  const handleAddTyre = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/tyres`, {
        brand,
        pattern,
        size,
        buying_price: parseFloat(buyingPrice),
        selling_price: parseFloat(sellingPrice),
        stock_quantity: parseInt(stockQuantity, 10)
      });

      if (res.data?.success) {
        setBrand('');
        setPattern('');
        setSize('');
        setBuyingPrice('');
        setSellingPrice('');
        setStockQuantity('');
        fetchTyres();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
      alert('Error adding tyre: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!selectedTyre) return;

    try {
      const qty = parseInt(saleQty, 10);
      const unitPrice = parseFloat(salePrice || selectedTyre.selling_price);

      const res = await axios.post(`${API_BASE}/api/tyres/sale`, {
        tyre_id: selectedTyre.id,
        quantity_sold: qty,
        customer_name: 'Walk-in Customer',
        sale_price_per_unit: unitPrice
      });

      if (res.data?.success) {
        setSaleMsg('Sale completed successfully!');
        fetchTyres();
        if (onDataChanged) onDataChanged();
        setTimeout(() => {
          setSelectedTyre(null);
          setSaleMsg(null);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setSaleMsg(err.response?.data?.message || 'Error processing transaction.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 rounded-4 shadow-sm border bg-body">
        <div>
          <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill fw-semibold">
            Retail & Wholesale
          </span>
          <h4 className="fw-bolder m-0 mt-1">Tyre Division & Inventory Control</h4>
        </div>
        <button className="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold" onClick={fetchTyres}>
          🔄 Refresh Stock
        </button>
      </div>

      {error && <div className="alert alert-danger rounded-3">{error}</div>}

      <div className="row g-4 mb-4">
        {/* Inventory Table */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header py-3 px-4 border-bottom bg-body d-flex justify-content-between align-items-center">
              <h6 className="fw-bold m-0">Real-Time Tyre Stock</h6>
              <span className="badge bg-secondary rounded-pill">{tyres.length} Items</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase">
                    <tr>
                      <th className="ps-4">Brand / Pattern</th>
                      <th>Size</th>
                      <th>Buy (Rs.)</th>
                      <th>Sell (Rs.)</th>
                      <th>Stock</th>
                      <th className="pe-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tyres.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">
                          No tyres currently registered in inventory.
                        </td>
                      </tr>
                    ) : (
                      tyres.map((t) => (
                        <tr key={t.id}>
                          <td className="ps-4">
                            <div className="fw-bold">{t.brand}</div>
                            <small className="text-secondary">{t.pattern || 'Standard'}</small>
                          </td>
                          <td><code>{t.size}</code></td>
                          <td>{Number(t.buying_price).toLocaleString()}</td>
                          <td className="text-success fw-semibold">{Number(t.selling_price).toLocaleString()}</td>
                          <td>
                            <span className={`badge rounded-pill ${t.stock_quantity < 5 ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}`}>
                              {t.stock_quantity} units
                            </span>
                          </td>
                          <td className="pe-4 text-center">
                            <button
                              className="btn btn-primary btn-sm rounded-pill px-3"
                              onClick={() => {
                                setSelectedTyre(t);
                                setSalePrice(t.selling_price);
                                setSaleQty(1);
                              }}
                            >
                              Sell
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

        {/* Add Tyre Item Form */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 className="fw-bold mb-3">Add Stock Item</h6>
            <form onSubmit={handleAddTyre} className="d-flex flex-column gap-2">
              <div>
                <label className="form-label small fw-semibold text-secondary">Brand</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. Dunlop, DSI"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label small fw-semibold text-secondary">Pattern / Series</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. SP Touring"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label small fw-semibold text-secondary">Size Spec</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. 195/65 R15"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  required
                />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Buying (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm rounded-3"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-secondary">Selling (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm rounded-3"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label small fw-semibold text-secondary">Units Received</label>
                <input
                  type="number"
                  className="form-control form-control-sm rounded-3"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm rounded-pill fw-semibold mt-2 py-2">
                Save New Tyre
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sell Action Drawer / Modal */}
      {selectedTyre && (
        <div className="card border-0 shadow-lg rounded-4 p-4 mb-4 border-start border-4 border-success">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold m-0 text-success">
              Checkout Transaction: {selectedTyre.brand} ({selectedTyre.size})
            </h6>
            <button className="btn btn-close btn-sm" onClick={() => setSelectedTyre(null)}></button>
          </div>

          {saleMsg && (
            <div className={`alert py-2 small ${saleMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>
              {saleMsg}
            </div>
          )}

          <form onSubmit={handleRecordSale} className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedTyre.stock_quantity}
                className="form-control form-control-sm rounded-3"
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary">Sale Price Per Unit (Rs.)</label>
              <input
                type="number"
                step="0.01"
                className="form-control form-control-sm rounded-3"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-success btn-sm rounded-pill px-4 fw-semibold w-100">
                Confirm Bill
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={() => setSelectedTyre(null)}
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

export default TyreModule;