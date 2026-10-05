const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/summary', async (req, res) => {
  try {
    // 1. Tyre Financials: Revenue & Estimated Profit (Selling - Buying price)
    const [tyreData] = await pool.query(`
      SELECT 
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM((s.unit_price - t.buying_price) * s.quantity_sold), 0) AS total_profit
      FROM tyre_sales s
      JOIN tyres t ON s.tyre_id = t.id
    `);

    // 2. EV Charging Financials: Total Revenue
    const [evData] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(energy_consumed_kwh), 0) AS total_kwh
      FROM charging_sessions
    `);

    // 3. Fleet Financials: Gross Trips Earnings & Total Expenses
    const [fleetEarnings] = await pool.query(`
      SELECT COALESCE(SUM(gross_earnings), 0) AS total_revenue FROM fleet_trips
    `);
    const [fleetExpenses] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM fleet_expenses
    `);

    const tyreRev = parseFloat(tyreData[0].total_revenue);
    const tyreProfit = parseFloat(tyreData[0].total_profit);

    const evRev = parseFloat(evData[0].total_revenue);
    // Assuming standard utility electricity unit cost margin (e.g., 60% gross margin)
    const evProfit = evRev * 0.40;

    const fleetRev = parseFloat(fleetEarnings[0].total_revenue);
    const fleetExp = parseFloat(fleetExpenses[0].total_expenses);
    const fleetProfit = fleetRev - fleetExp;

    const overallRevenue = tyreRev + evRev + fleetRev;
    const overallProfit = tyreProfit + evProfit + fleetProfit;

    // Rule-Based Decision Support Insights
    const insights = [];

    // Rule A: Low stock alert
    const [lowStock] = await pool.query('SELECT brand, size, stock_quantity FROM tyres WHERE stock_quantity < 5');
    lowStock.forEach(item => {
      insights.push({
        type: 'warning',
        module: 'Tyre Inventory',
        message: `Low Stock: ${item.brand} (${item.size}) has only ${item.stock_quantity} left.`
      });
    });

    // Rule B: Fleet profitability check
    if (fleetRev > 0 && fleetExp / fleetRev > 0.6) {
      insights.push({
        type: 'danger',
        module: 'Fleet Operations',
        message: 'High Expense Ratio: Vehicle operational expenses exceed 60% of earnings.'
      });
    }

    // Rule C: Segment performance
    const sectors = [
      { name: 'Tyre Sales', profit: tyreProfit },
      { name: 'EV Charging', profit: evProfit },
      { name: 'Ride-Hailing Fleet', profit: fleetProfit }
    ];
    sectors.sort((a, b) => b.profit - a.profit);
    if (overallProfit > 0) {
      insights.push({
        type: 'info',
        module: 'Executive Summary',
        message: `${sectors[0].name} is currently generating the highest net profit.`
      });
    }

    res.json({
      success: true,
      summary: {
        total_business_revenue: overallRevenue.toFixed(2),
        total_business_profit: overallProfit.toFixed(2),
        breakdown: {
          tyres: { revenue: tyreRev.toFixed(2), profit: tyreProfit.toFixed(2) },
          ev_charging: { revenue: evRev.toFixed(2), total_kwh: evData[0].total_kwh, estimated_profit: evProfit.toFixed(2) },
          fleet: { revenue: fleetRev.toFixed(2), expenses: fleetExp.toFixed(2), net_profit: fleetProfit.toFixed(2) }
        }
      },
      decision_insights: insights
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;