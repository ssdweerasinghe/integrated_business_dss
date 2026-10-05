const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/summary', async (req, res) => {
  try {
    // 1. Tyre Financials
    const [tyreData] = await pool.query(`
      SELECT 
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM((s.unit_price - t.buying_price) * s.quantity_sold), 0) AS total_profit,
        COALESCE(SUM(s.quantity_sold), 0) AS total_units_sold
      FROM tyre_sales s
      JOIN tyres t ON s.tyre_id = t.id
    `);

    // 2. EV Charging Financials
    const [evData] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(SUM(energy_consumed_kwh), 0) AS total_kwh,
        COUNT(id) AS total_sessions
      FROM charging_sessions
    `);

    // 3. Fleet Financials
    const [fleetEarnings] = await pool.query(`
      SELECT 
        COALESCE(SUM(gross_earnings), 0) AS total_revenue,
        COUNT(id) AS total_trips
      FROM fleet_trips
    `);
    const [fleetExpenses] = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN expense_type = 'Fuel' THEN amount ELSE 0 END), 0) AS fuel_expenses
      FROM fleet_expenses
    `);

    const tyreRev = parseFloat(tyreData[0].total_revenue);
    const tyreProfit = parseFloat(tyreData[0].total_profit);

    const evRev = parseFloat(evData[0].total_revenue);
    const evKwh = parseFloat(evData[0].total_kwh);
    const evProfit = evRev * 0.40; // 40% margin on charging tariffs

    const fleetRev = parseFloat(fleetEarnings[0].total_revenue);
    const fleetExp = parseFloat(fleetExpenses[0].total_expenses);
    const fuelExp = parseFloat(fleetExpenses[0].fuel_expenses);
    const fleetProfit = fleetRev - fleetExp;

    const overallRevenue = tyreRev + evRev + fleetRev;
    const overallProfit = tyreProfit + evProfit + fleetProfit;

    // Advanced Cross-Sector Decision Rules
    const insights = [];

    // Rule 1: Inventory reorder warnings
    const [lowStock] = await pool.query('SELECT brand, size, stock_quantity FROM tyres WHERE stock_quantity < 5');
    lowStock.forEach(item => {
      insights.push({
        type: 'warning',
        module: 'Tyre Inventory',
        message: `Inventory Alert: ${item.brand} (${item.size}) has only ${item.stock_quantity} units remaining.`
      });
    });

    // Rule 2: Fleet Operating Ratio
    if (fleetRev > 0) {
      const expRatio = (fleetExp / fleetRev) * 100;
      if (expRatio > 60) {
        insights.push({
          type: 'danger',
          module: 'Fleet Operations',
          message: `Elevated Operating Ratio: Fleet expenses represent ${expRatio.toFixed(1)}% of gross earnings.`
        });
      }
    }

    // Rule 3: Cross-Sector Synergy (EV vs Fuel Cost)
    if (fuelExp > 0 && evRev > 0) {
      if (fuelExp > evProfit) {
        insights.push({
          type: 'warning',
          module: 'Synergy Analysis',
          message: `Fleet fuel costs (Rs. ${fuelExp.toLocaleString()}) surpass net EV charging profit (Rs. ${evProfit.toLocaleString()}). Prioritize transitioning fleet units to EV.`
        });
      } else {
        insights.push({
          type: 'success',
          module: 'Synergy Analysis',
          message: `EV charging profits currently offset ${((evProfit / fuelExp) * 100).toFixed(0)}% of the internal combustion fleet's fuel expenditure.`
        });
      }
    }

    // Rule 4: Top Contributing Sector
    const sectors = [
      { name: 'Tyre Sales', profit: tyreProfit },
      { name: 'EV Charging', profit: evProfit },
      { name: 'Fleet Operations', profit: fleetProfit }
    ];
    sectors.sort((a, b) => b.profit - a.profit);
    if (overallProfit > 0) {
      insights.push({
        type: 'info',
        module: 'Executive Strategy',
        message: `${sectors[0].name} leads overall net profitability (Rs. ${sectors[0].profit.toFixed(2)}).`
      });
    }

    res.json({
      success: true,
      summary: {
        total_business_revenue: overallRevenue.toFixed(2),
        total_business_profit: overallProfit.toFixed(2),
        breakdown: {
          tyres: { 
            revenue: tyreRev.toFixed(2), 
            profit: tyreProfit.toFixed(2),
            units_sold: tyreData[0].total_units_sold 
          },
          ev_charging: { 
            revenue: evRev.toFixed(2), 
            total_kwh: evKwh, 
            estimated_profit: evProfit.toFixed(2),
            sessions_count: evData[0].total_sessions
          },
          fleet: { 
            revenue: fleetRev.toFixed(2), 
            expenses: fleetExp.toFixed(2), 
            net_profit: fleetProfit.toFixed(2),
            fuel_cost: fuelExp.toFixed(2),
            trips_count: fleetEarnings[0].total_trips
          }
        }
      },
      decision_insights: insights
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;