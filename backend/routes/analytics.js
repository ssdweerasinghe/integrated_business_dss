const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/summary', async (req, res) => {
  try {
    const [tyreRows] = await db.query(
      'SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COALESCE(SUM(total_amount * 0.25), 0) AS total_profit FROM tyre_sales'
    );
    const tyreRevenue = Number(tyreRows[0]?.total_revenue || 0);
    const tyreProfit = Number(tyreRows[0]?.total_profit || 0);

    const [evRows] = await db.query(
      'SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COALESCE(SUM(energy_consumed_kwh), 0) AS total_kwh FROM charging_sessions'
    );
    const evRevenue = Number(evRows[0]?.total_revenue || 0);
    const evKwh = Number(evRows[0]?.total_kwh || 0);
    const evProfit = evRevenue * 0.35;

    const [tripRows] = await db.query(
      'SELECT COALESCE(SUM(gross_earnings), 0) AS total_fare FROM fleet_trips'
    );
    const [expRows] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM fleet_expenses'
    );
    const fleetRevenue = Number(tripRows[0]?.total_fare || 0);
    const fleetExpenses = Number(expRows[0]?.total_expenses || 0);
    const fleetProfit = fleetRevenue - fleetExpenses;

    const totalBusinessRevenue = tyreRevenue + evRevenue + fleetRevenue;
    const totalBusinessProfit = tyreProfit + evProfit + fleetProfit;

    const decision_insights = [];

    if (fleetExpenses > fleetRevenue && fleetRevenue > 0) {
      decision_insights.push({
        module: 'Fleet Mobility',
        type: 'danger',
        message: 'Fleet operating burn exceeds trip collections. Shift high-mileage ICE routes to EV units.'
      });
    } else {
      decision_insights.push({
        module: 'Fleet Mobility',
        type: 'success',
        message: `Fleet contribution margin is positive (+Rs. ${Math.round(fleetProfit).toLocaleString()}).`
      });
    }

    if (evKwh > 0) {
      decision_insights.push({
        module: 'EV Charging Hub',
        type: 'info',
        message: `High charging throughput recorded (${evKwh.toFixed(1)} kWh delivered). Off-peak capacity is optimal.`
      });
    }

    if (tyreRevenue > 0) {
      decision_insights.push({
        module: 'Tyre Inventory',
        type: 'info',
        message: `Inventory turnover active with Rs. ${Math.round(tyreRevenue).toLocaleString()} gross sales recorded.`
      });
    }

    return res.json({
      success: true,
      summary: {
        total_business_revenue: totalBusinessRevenue,
        total_business_profit: totalBusinessProfit,
        breakdown: {
          tyres: {
            revenue: tyreRevenue,
            profit: tyreProfit
          },
          ev_charging: {
            revenue: evRevenue,
            estimated_profit: evProfit,
            total_kwh: evKwh
          },
          fleet: {
            revenue: fleetRevenue,
            expenses: fleetExpenses,
            net_profit: fleetProfit
          }
        }
      },
      decision_insights
    });
  } catch (err) {
    console.error('Analytics Route Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute analytics: ' + err.message
    });
  }
});

module.exports = router;