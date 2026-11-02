import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function TyreModule({ currentUser, onDataChanged }) {
  const isAdmin = currentUser?.role === 'Admin';
  const [tyres, setTyres] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newTyre, setNewTyre] = useState({
    brand: '', pattern: '', size: '', buying_price: '', selling_price: '', stock_quantity: ''
  });

  const [selectedTyre, setSelectedTyre] = useState(null);
  const [sellData, setSellData] = useState({ quantity: 1, sale_price_per_unit: 0, customer_name: '' });
  const [checkoutError, setCheckoutError] = useState(null);

  const fetchTyres = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tyres`);
      if (res.data.success) setTyres(res.data.data);
    } catch (err) {
      setError('Failed to fetch tyres');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tyres/sales/history`);
      if (res.data.success) setSales(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tyre sales history', err);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
    fetchSalesHistory();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/tyres`, newTyre);
      setNewTyre({ brand: '', pattern: '', size: '', buying_price: '', selling_price: '', stock_quantity: '' });
      fetchTyres();
      fetchSalesHistory();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert('Error adding tyre: ' + (err.response?.data?.message || err.message));
    }
  };

  const initiateSale = (tyre) => {
    setSelectedTyre(tyre);
    setSellData({ quantity: 1, sale_price_per_unit: Number(tyre.selling_price), customer_name: '' });
    setCheckoutError(null);
  };

  const handleConfirmBill = async () => {
    setCheckoutError(null);
    try {
      const payload = {
        tyre_id: selectedTyre.id,
        quantity: Number(sellData.quantity),
        sale_price_per_unit: Number(sellData.sale_price_per_unit),
        customer_name: sellData.customer_name || 'Walk-in Customer'
      };

      const res = await axios.post(`${API_BASE}/api/tyres/sale`, payload);

      if (res.data.success) {
        setSelectedTyre(null);
        fetchTyres();
        fetchSalesHistory();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Error processing transaction.');
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!isAdmin) {
      alert('Only administrators can delete sales records.');
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/tyres/sales/${saleId}`);
      fetchTyres();
      fetchSalesHistory();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete sale record.');
    }
  };

  const handleDeleteTyre = async (tyreId) => {
    if (!isAdmin) {
      alert('Only administrators can delete stock items.');
      return;
    }

    try {
      await axios.delete(`${API_BASE}/api/tyres/${tyreId}`);
      fetchTyres();
      fetchSalesHistory();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete tyre record.');
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-8">
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="fw-bold m-0">Real-Time Tyre Stock</h6>
            <span className="badge bg-secondary rounded-pill">{tyres.length} Items</span>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="text-secondary small">
                  <tr>
                    <th>BRAND / PATTERN</th>
                    <th>SIZE</th>
                    <th>BUY (RS.)</th>
                    <th>SELL (RS.)</th>
                    <th>STOCK</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {tyres.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="fw-bold text-dark">{t.brand}</div>
                        <div className="small text-secondary">{t.pattern}</div>
                      </td>
                      <td className="text-danger small">{t.size}</td>
                      <td>{Number(t.buying_price).toLocaleString()}</td>
                      <td className="text-success fw-semibold">{Number(t.selling_price).toLocaleString()}</td>
                      <td>
                        <span className={`badge px-2 py-1 ${Number(t.stock_quantity) < 5 ? 'bg-danger-subtle text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                          {t.stock_quantity} units
                        </span>
                      </td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => initiateSale(t)}>Sell</button>
                        {isAdmin && (
                          <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleDeleteTyre(t.id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
          <h6 className="fw-bold mb-4">Add Stock Item</h6>
          <form onSubmit={handleAddStock}>
            <div className="mb-3">
              <label className="form-label small text-secondary">Brand</label>
              <input type="text" className="form-control" placeholder="e.g. Dunlop, DSI" value={newTyre.brand} onChange={(e) => setNewTyre({ ...newTyre, brand: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label small text-secondary">Pattern / Series</label>
              <input type="text" className="form-control" placeholder="e.g. SP Touring" value={newTyre.pattern} onChange={(e) => setNewTyre({ ...newTyre, pattern: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label small text-secondary">Size Spec</label>
              <input type="text" className="form-control" placeholder="e.g. 195/65 R15" value={newTyre.size} onChange={(e) => setNewTyre({ ...newTyre, size: e.target.value })} required />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small text-secondary">Buying (Rs.)</label>
                <input type="number" className="form-control" value={newTyre.buying_price} onChange={(e) => setNewTyre({ ...newTyre, buying_price: e.target.value })} required />
              </div>
              <div className="col-6">
                <label className="form-label small text-secondary">Selling (Rs.)</label>
                <input type="number" className="form-control" value={newTyre.selling_price} onChange={(e) => setNewTyre({ ...newTyre, selling_price: e.target.value })} required />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label small text-secondary">Units Received</label>
              <input type="number" className="form-control" value={newTyre.stock_quantity} onChange={(e) => setNewTyre({ ...newTyre, stock_quantity: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 rounded-pill fw-semibold">Save New Tyre</button>
          </form>
        </div>
      </div>

      {selectedTyre && (
        <div className="col-12 mt-4">
          <div className="card border-success border-2 shadow-sm rounded-4 p-4 bg-white position-relative">
            <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={() => setSelectedTyre(null)}></button>
            <h6 className="fw-bold text-success mb-3">Checkout Transaction: {selectedTyre.brand} ({selectedTyre.size})</h6>

            {checkoutError && <div className="alert alert-danger py-2 small">{checkoutError}</div>}

            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small text-secondary">Quantity</label>
                <input type="number" className="form-control" min="1" max={selectedTyre.stock_quantity} value={sellData.quantity} onChange={(e) => setSellData({ ...sellData, quantity: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-secondary">Customer</label>
                <input type="text" className="form-control" placeholder="Walk-in customer" value={sellData.customer_name} onChange={(e) => setSellData({ ...sellData, customer_name: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-secondary">Sale Price Per Unit (Rs.)</label>
                <input type="number" className="form-control" value={sellData.sale_price_per_unit} onChange={(e) => setSellData({ ...sellData, sale_price_per_unit: e.target.value })} />
              </div>
              <div className="col-md-3 text-end d-flex gap-2 justify-content-end">
                <button className="btn btn-success rounded-pill px-4 fw-semibold w-100" onClick={handleConfirmBill}>Confirm Bill</button>
                <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setSelectedTyre(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="col-12 mt-2">
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold m-0">Tyre Sales Ledger</h6>
            <span className="badge bg-secondary rounded-pill">{sales.length} Records</span>
          </div>

          {salesLoading ? (
            <p className="text-secondary mb-0">Loading sales history...</p>
          ) : sales.length === 0 ? (
            <p className="text-secondary mb-0">No tyre sales logged yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="text-secondary small">
                  <tr>
                    <th>Customer</th>
                    <th>Tyre</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                    <th>Margin</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.customer_name}</td>
                      <td>{sale.brand} {sale.size}</td>
                      <td>{sale.quantity_sold}</td>
                      <td>Rs. {Number(sale.unit_price).toLocaleString()}</td>
                      <td>Rs. {Number(sale.total_amount).toLocaleString()}</td>
                      <td className="text-success fw-semibold">Rs. {Number(sale.gross_profit || 0).toLocaleString()}</td>
                      <td>
                        {isAdmin && (
                          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => handleDeleteSale(sale.id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}