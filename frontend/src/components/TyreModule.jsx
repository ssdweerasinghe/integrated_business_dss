import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TyreModule({ onDataChanged }) {
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states for adding a tyre
  const [brand, setBrand] = useState('');
  const [pattern, setPattern] = useState('');
  const [size, setSize] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Form states for selling tyres
  const [selectedTyreId, setSelectedTyreId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sellQuantity, setSellQuantity] = useState(1);

  const fetchTyres = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tyres');
      if (res.data.success) {
        setTyres(res.data.data);
        if (res.data.data.length > 0 && !selectedTyreId) {
          setSelectedTyreId(res.data.data[0].id);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
  }, []);

  // Handle Add Tyre
  const handleAddTyre = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tyres', {
        brand,
        pattern,
        size,
        stock_quantity: parseInt(stockQuantity),
        buying_price: parseFloat(buyingPrice),
        selling_price: parseFloat(sellingPrice)
      });
      setStatusMessage({ type: 'success', text: 'Tyre added to inventory successfully!' });
      setBrand('');
      setPattern('');
      setSize('');
      setStockQuantity('');
      setBuyingPrice('');
      setSellingPrice('');
      fetchTyres();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to add tyre' });
    }
  };

  // Handle Record Sale
  const handleSellTyre = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tyres/sale', {
        tyre_id: parseInt(selectedTyreId),
        customer_name: customerName,
        quantity_sold: parseInt(sellQuantity)
      });
      setStatusMessage({ type: 'success', text: 'Sale completed and stock deducted successfully!' });
      setCustomerName('');
      setSellQuantity(1);
      fetchTyres();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.response?.data?.message || 'Sale transaction failed' });
    }
  };

  if (loading) return <div>Loading Tyre Records...</div>;

  return (
    <div className="container-fluid p-0">
      {statusMessage && (
        <div className={`alert alert-${statusMessage.type} alert-dismissible fade show`} role="alert">
          {statusMessage.text}
          <button type="button" className="btn-close" onClick={() => setStatusMessage(null)}></button>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Add Tyre to Inventory Form */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">➕ Add New Tyre to Inventory</div>
            <div className="card-body">
              <form onSubmit={handleAddTyre}>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Brand</label>
                    <input type="text" className="form-control" required placeholder="e.g. Bridgestone" value={brand} onChange={e => setBrand(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Pattern / Model</label>
                    <input type="text" className="form-control" placeholder="e.g. Ecopia EP150" value={pattern} onChange={e => setPattern(e.target.value)} />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Tyre Size</label>
                    <input type="text" className="form-control" required placeholder="e.g. 195/65R15" value={size} onChange={e => setSize(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Initial Stock</label>
                    <input type="number" className="form-control" required min="1" placeholder="e.g. 10" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Buying Price (LKR)</label>
                    <input type="number" className="form-control" required step="0.01" placeholder="e.g. 28000" value={buyingPrice} onChange={e => setBuyingPrice(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Selling Price (LKR)</label>
                    <input type="number" className="form-control" required step="0.01" placeholder="e.g. 34000" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100">Save Tyre</button>
              </form>
            </div>
          </div>
        </div>

        {/* Record POS Sale Form */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold py-3">💳 Point of Sale (POS) — Record Sale</div>
            <div className="card-body">
              <form onSubmit={handleSellTyre}>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Select Tyre Product</label>
                  <select className="form-select" value={selectedTyreId} onChange={e => setSelectedTyreId(e.target.value)} required>
                    {tyres.map(t => (
                      <option key={t.id} value={t.id} disabled={t.stock_quantity === 0}>
                        {t.brand} {t.size} — Stock: {t.stock_quantity} — Rs. {Number(t.selling_price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Customer Name</label>
                  <input type="text" className="form-control" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Quantity to Sell</label>
                  <input type="number" className="form-control" min="1" required value={sellQuantity} onChange={e => setSellQuantity(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={tyres.length === 0}>Complete Sale</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Inventory Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white fw-bold py-3">📦 Real-Time Tyre Inventory</div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Brand</th>
                <th>Pattern</th>
                <th>Size</th>
                <th>Stock</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {tyres.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-3 text-muted">No tyres available in inventory.</td></tr>
              ) : (
                tyres.map(tyre => {
                  const margin = (parseFloat(tyre.selling_price) - parseFloat(tyre.buying_price)).toFixed(2);
                  return (
                    <tr key={tyre.id}>
                      <td>#{tyre.id}</td>
                      <td className="fw-semibold">{tyre.brand}</td>
                      <td>{tyre.pattern || '—'}</td>
                      <td><span className="badge bg-secondary">{tyre.size}</span></td>
                      <td>
                        <span className={`badge ${tyre.stock_quantity < 5 ? 'bg-danger' : 'bg-success'}`}>
                          {tyre.stock_quantity} units
                        </span>
                      </td>
                      <td>Rs. {Number(tyre.buying_price).toLocaleString()}</td>
                      <td className="fw-bold">Rs. {Number(tyre.selling_price).toLocaleString()}</td>
                      <td className="text-success fw-semibold">+Rs. {Number(margin).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TyreModule;