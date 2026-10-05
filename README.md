# Integrated Business Decision Support System (DSS)
> **Case Study: Multi-Sector Commercial Operations in Piliyandala, Sri Lanka**

A full-stack, web-based Decision Support System designed to integrate, automate, and optimize multi-unit commercial activities managed under a centralized business hub in Piliyandala: **Tyre Sales & Retreading POS**, **Electric Vehicle (EV) Charging Station Infrastructure**, and **Ride-Hailing Fleet Operations (Uber & PickMe)**.

---

## 📌 Executive Summary

Managing cross-sector operations via disconnected manual ledgers or isolated software packages often creates operational blind spots, inventory discrepancies, and obscured net profitability. 

This platform unifies these business sectors through a unified operational architecture that:
- Centralizes transaction pipelines across retail tyre stock, public EV charging bays, and commercial fleet earnings.
- Automates stock decrements and inventory valuation using ACID-compliant database transaction locks.
- Provides an **Executive Decision Support System (DSS)** engine that aggregates overall revenue, sector profitability, and cross-sector strategic insights (such as comparing EV charging profit margins against combustion fuel expenses).
- Implements **Role-Based Access Control (RBAC)** to ensure operators access only their specific departmental tabs, while owners and accountants maintain executive business intelligence.

---

## 🛠️️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Bootstrap 5, Chart.js, React-ChartJS-2, Axios |
| **Backend API** | Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt.js, CORS |
| **Database** | MySQL 8.0 (8 normalized tables, foreign keys, transaction handling) |
| **Analytics Engine** | Python 3, Pandas, SQLAlchemy, PyMySQL |

---

## 🏛️ System Architecture

```text
integrated_business_dss/
├── backend/               # Express.js REST API & Database Models
│   ├── config/            # MySQL Connection Pool (db.js)
│   ├── routes/            # Modular REST Endpoint Controllers
│   │   ├── auth.js        # JWT Login & Bcrypt Registration Handlers
│   │   ├── tyres.js       # Stock Management & POS Sale Transactions
│   │   ├── ev.js          # Charging Bays & Energy Consumption Sessions
│   │   ├── fleet.js       # Fleet Registry, Daily Trips & Cost Logging
│   │   └── analytics.js   # Centralized Aggregation & Rule-Based Heuristics
│   ├── schema.sql         # Relational DDL Database Schema & Seed Data
│   └── server.js          # Express Gateway Application
├── frontend/              # Vite + React Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx        # JWT Authentication View
│   │   │   ├── TyreModule.jsx   # Inventory Control & POS Sale Interface
│   │   │   ├── EVModule.jsx     # EV Bays & kWh Session Billing Interface
│   │   │   └── FleetModule.jsx  # Trip Earnings & Operational Expense Log
│   │   ├── App.jsx              # Executive Dashboard, RBAC Guards & Charts
│   │   └── main.jsx             # Entry Point & Bootstrap Importer
└── analytics/             # Python Data Science & Audit Service
    └── generate_report.py # Automated Pandas SQL Report & CSV Exporter