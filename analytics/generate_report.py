import os
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine

# Database Connection via SQLAlchemy
DB_URI = 'mysql+pymysql://root:1234@localhost:3306/integrated_business_dss'
engine = create_engine(DB_URI)

def fetch_data():
    with engine.connect() as conn:
        tyres_df = pd.read_sql("SELECT * FROM tyres", conn)
        sales_df = pd.read_sql("SELECT * FROM tyre_sales", conn)
        ev_points_df = pd.read_sql("SELECT * FROM charging_points", conn)
        ev_sessions_df = pd.read_sql("SELECT * FROM charging_sessions", conn)
        trips_df = pd.read_sql("SELECT * FROM fleet_trips", conn)
        expenses_df = pd.read_sql("SELECT * FROM fleet_expenses", conn)
    return tyres_df, sales_df, ev_points_df, ev_sessions_df, trips_df, expenses_df

def run_dss_analysis():
    print("=" * 60)
    print(" INTEGRATED DECISION SUPPORT SYSTEM (DSS) - PILIYANDALA")
    print(f" Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tyres, sales, ev_points, ev_sessions, trips, expenses = fetch_data()
    
    # 1. Tyre Sector Analysis
    tyre_rev = sales['total_amount'].sum() if not sales.empty else 0.0
    merged_sales = sales.merge(tyres, left_on='tyre_id', right_on='id', suffixes=('_sale', '_stock'))
    tyre_profit = ((merged_sales['unit_price'] - merged_sales['buying_price']) * merged_sales['quantity_sold']).sum() if not merged_sales.empty else 0.0

    # 2. EV Charging Sector Analysis
    ev_rev = ev_sessions['total_amount'].sum() if not ev_sessions.empty else 0.0
    ev_kwh = ev_sessions['energy_consumed_kwh'].sum() if not ev_sessions.empty else 0.0
    ev_est_profit = ev_rev * 0.40

    # 3. Fleet Sector Analysis
    fleet_rev = trips['gross_earnings'].sum() if not trips.empty else 0.0
    fleet_exp = expenses['amount'].sum() if not expenses.empty else 0.0
    fleet_profit = fleet_rev - fleet_exp

    total_revenue = tyre_rev + ev_rev + fleet_rev
    total_profit = tyre_profit + ev_est_profit + fleet_profit

    # Performance Table
    summary_data = [
        {"Sector": "Tyre Inventory & Sales", "Revenue (LKR)": tyre_rev, "Net Profit (LKR)": tyre_profit, "Margin": f"{(tyre_profit / tyre_rev * 100):.1f}%" if tyre_rev > 0 else "N/A"},
        {"Sector": "EV Charging Station", "Revenue (LKR)": ev_rev, "Net Profit (LKR)": ev_est_profit, "Margin": f"{(ev_est_profit / ev_rev * 100):.1f}%" if ev_rev > 0 else "N/A"},
        {"Sector": "Fleet Operations", "Revenue (LKR)": fleet_rev, "Net Profit (LKR)": fleet_profit, "Margin": f"{(fleet_profit / fleet_rev * 100):.1f}%" if fleet_rev > 0 else "N/A"}
    ]
    summary_df = pd.DataFrame(summary_data)
    print("\n--- SECTOR FINANCIAL SUMMARY ---")
    print(summary_df.to_string(index=False))

    print(f"\nOverall Business Revenue : Rs. {total_revenue:,.2f}")
    print(f"Overall Net Profit       : Rs. {total_profit:,.2f}")

    # Export to CSV for audit records
    report_filename = f"dss_executive_summary_{datetime.now().strftime('%Y%m%d')}.csv"
    summary_df.to_csv(report_filename, index=False)
    print(f"\n[+] Audit report exported: {os.path.abspath(report_filename)}")

    # Decision Engine Recommendations
    print("\n--- AUTOMATED DECISION SUPPORT RECOMMENDATIONS ---")
    
    # Inventory Rule
    low_stock = tyres[tyres['stock_quantity'] < 5]
    if not low_stock.empty:
        for _, row in low_stock.iterrows():
            print(f"[*] REORDER WARNING: Tyre {row['brand']} ({row['size']}) has only {row['stock_quantity']} units in stock.")

    # Fleet vs EV Fuel Synergy Rule
    fuel_cost = expenses[expenses['expense_type'] == 'Fuel']['amount'].sum() if not expenses.empty else 0.0
    if fuel_cost > 0 and ev_est_profit > 0:
        offset_pct = (ev_est_profit / fuel_cost) * 100
        print(f"[*] SYNERGY INSIGHT: EV charging profits cover {offset_pct:.1f}% of fleet fuel expenditures.")

    print("=" * 60)

if __name__ == '__main__':
    run_dss_analysis()