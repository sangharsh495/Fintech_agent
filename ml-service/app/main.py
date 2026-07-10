import sys
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler

def parse_args():
    parser = argparse.ArgumentParser(description="FinWise Transaction Clustering ML Service")
    parser.add_argument("--file", required=True, help="Path to input transactions JSON file")
    parser.add_argument("--userId", required=True, help="User ID to process")
    return parser.parse_args()

def circular_encode(values, max_value):
    radians = 2 * np.pi * values / max_value
    return np.sin(radians), np.cos(radians)

def get_dominant_value(df, column):
    if df.empty or column not in df.columns:
        return "unknown"
    val = df[column].mode()
    return val.iloc[0] if not val.empty else "unknown"

def generate_color(index):
    # Distinct colors for UI presentation
    colors = ["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#14b8a6"]
    return colors[index % len(colors)]

def main():
    args = parse_args()
    
    with open(args.file, 'r') as f:
        input_data = json.load(f)
        
    txns_raw = input_data.get("transactions", [])
    if len(txns_raw) < 5:
        # Graceful fallback if too few transactions
        print(json.dumps({"error": "Insufficient transactions for clustering"}))
        return

    df = pd.DataFrame(txns_raw)
    
    # Process dates, hours, and days
    df['parsed_date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['parsed_date'].dt.dayofweek
    df['hour_of_day'] = df['parsed_date'].dt.hour
    
    # Pre-encode variables
    # Circular encode day_of_week and hour_of_day
    day_sin, day_cos = circular_encode(df['day_of_week'], 7)
    hour_sin, hour_cos = circular_encode(df['hour_of_day'], 24)
    
    df['day_sin'] = day_sin
    df['day_cos'] = day_cos
    df['hour_sin'] = hour_sin
    df['hour_cos'] = hour_cos
    
    # Outputs structure
    results = {
        "algorithm": "kmeans",
        "n_clusters": 0,
        "silhouette_score": 0.0,
        "inertia": 0.0,
        "total_transactions": len(df),
        "parameters": {"init": "k-means++", "random_state": 42},
        "clusters": {},
        "metadata": {},
        "anomalies": []
    }
    
    # --- 1. SPENDING BEHAVIOR CLUSTERING ---
    # Features: Amount (log-scaled), day_of_week, hour_of_day
    df['amount_log'] = np.log1p(df['amount'])
    features_spending = df[['amount_log', 'day_sin', 'day_cos', 'hour_sin', 'hour_cos']].values
    scaler = StandardScaler()
    scaled_spending = scaler.fit_transform(features_spending)
    
    n_spending_clusters = min(4, len(df))
    kmeans_spending = KMeans(n_clusters=n_spending_clusters, random_state=42, n_init=10)
    df['spending_cluster_id'] = kmeans_spending.fit_predict(scaled_spending)
    
    results["clusters"]["spending_behavior"] = {}
    results["metadata"]["spending_behavior"] = {}
    
    for c_id in range(n_spending_clusters):
        c_txns = df[df['spending_cluster_id'] == c_id]
        txn_ids = c_txns['id'].tolist()
        results["clusters"]["spending_behavior"][str(c_id)] = txn_ids
        
        # Calculate stats
        avg_amt = float(c_txns['amount'].mean())
        total_amt = float(c_txns['amount'].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, 'category')
        dom_pay = get_dominant_value(c_txns, 'payment_method')
        
        results["metadata"]["spending_behavior"][str(c_id)] = {
            "label": f"Behavior Cluster {c_id + 1}",
            "description": f"Average ticket size ₹{avg_amt:,.0f} mainly spent on {dom_cat.replace('_', ' ')} via {dom_pay.upper()}.",
            "color": generate_color(c_id),
            "centroid": kmeans_spending.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns['amount'].min()),
            "max_amount": float(c_txns['amount'].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage
        }

    # --- 2. TRANSACTION SIZE CLUSTERING ---
    # 1D clustering on amount
    features_size = df[['amount']].values
    n_size_clusters = min(4, len(df))
    kmeans_size = KMeans(n_clusters=n_size_clusters, random_state=42, n_init=10)
    df['size_cluster_raw'] = kmeans_size.fit_predict(features_size)
    
    # Sort clusters by average amount to map to human-friendly sizes
    centers = kmeans_size.cluster_centers_.flatten()
    sorted_idx = np.argsort(centers)
    size_mapping = {sorted_idx[i]: i for i in range(len(sorted_idx))}
    df['size_cluster_id'] = df['size_cluster_raw'].map(size_mapping)
    
    results["clusters"]["transaction_size"] = {}
    results["metadata"]["transaction_size"] = {}
    size_labels = ["Micro Transactions", "Standard Expenses", "High-value Purchases", "Major Transactions"]
    size_colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]
    
    for c_id in range(n_size_clusters):
        c_txns = df[df['size_cluster_id'] == c_id]
        txn_ids = c_txns['id'].tolist()
        results["clusters"]["transaction_size"][str(c_id)] = txn_ids
        
        avg_amt = float(c_txns['amount'].mean())
        total_amt = float(c_txns['amount'].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, 'category')
        dom_pay = get_dominant_value(c_txns, 'payment_method')
        
        results["metadata"]["transaction_size"][str(c_id)] = {
            "label": size_labels[c_id] if c_id < len(size_labels) else f"Size Category {c_id + 1}",
            "description": f"Transactions ranging from ₹{c_txns['amount'].min():,.0f} to ₹{c_txns['amount'].max():,.0f}.",
            "color": size_colors[c_id] if c_id < len(size_colors) else generate_color(c_id + 4),
            "centroid": [float(centers[sorted_idx[c_id]])],
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns['amount'].min()),
            "max_amount": float(c_txns['amount'].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage
        }

    # --- 3. TEMPORAL CLUSTERING ---
    # Features: Day of week and hour of day
    features_temp = df[['day_sin', 'day_cos', 'hour_sin', 'hour_cos']].values
    n_temp_clusters = min(3, len(df))
    kmeans_temp = KMeans(n_clusters=n_temp_clusters, random_state=42, n_init=10)
    df['temp_cluster_id'] = kmeans_temp.fit_predict(features_temp)
    
    results["clusters"]["temporal"] = {}
    results["metadata"]["temporal"] = {}
    temp_labels = ["Weekday Spending", "Weekend Outings", "Late Night Activities"]
    temp_colors = ["#8b5cf6", "#ec4899", "#0f172a"]
    
    for c_id in range(n_temp_clusters):
        c_txns = df[df['temp_cluster_id'] == c_id]
        txn_ids = c_txns['id'].tolist()
        results["clusters"]["temporal"][str(c_id)] = txn_ids
        
        avg_amt = float(c_txns['amount'].mean())
        total_amt = float(c_txns['amount'].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, 'category')
        dom_pay = get_dominant_value(c_txns, 'payment_method')
        
        results["metadata"]["temporal"][str(c_id)] = {
            "label": temp_labels[c_id] if c_id < len(temp_labels) else f"Time Pattern {c_id + 1}",
            "description": f"Transactions occurring during standard patterns (dominant: {dom_cat.replace('_', ' ')}).",
            "color": temp_colors[c_id] if c_id < len(temp_colors) else generate_color(c_id + 2),
            "centroid": kmeans_temp.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns['amount'].min()),
            "max_amount": float(c_txns['amount'].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage
        }

    # --- 4. CATEGORY AFFINITY CLUSTERING ---
    # One-hot encode category
    df_cat_dummies = pd.get_dummies(df['category'])
    n_cat_clusters = min(3, len(df))
    kmeans_cat = KMeans(n_clusters=n_cat_clusters, random_state=42, n_init=10)
    df['cat_cluster_id'] = kmeans_cat.fit_predict(df_cat_dummies.values)
    
    results["clusters"]["category_affinity"] = {}
    results["metadata"]["category_affinity"] = {}
    
    for c_id in range(n_cat_clusters):
        c_txns = df[df['cat_cluster_id'] == c_id]
        txn_ids = c_txns['id'].tolist()
        results["clusters"]["category_affinity"][str(c_id)] = txn_ids
        
        avg_amt = float(c_txns['amount'].mean())
        total_amt = float(c_txns['amount'].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, 'category')
        dom_pay = get_dominant_value(c_txns, 'payment_method')
        
        results["metadata"]["category_affinity"][str(c_id)] = {
            "label": f"{dom_cat.replace('_', ' ').title()} Hub",
            "description": f"Transactions clustered heavily around {dom_cat.replace('_', ' ')} purchases.",
            "color": generate_color(c_id + 5),
            "centroid": kmeans_cat.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns['amount'].min()),
            "max_amount": float(c_txns['amount'].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage
        }

    # --- 5. ANOMALY DETECTION (DBSCAN) ---
    # Use log-scaled amount and hour of day
    features_anomaly = df[['amount_log', 'hour_sin', 'hour_cos']].values
    scaled_anomaly = StandardScaler().fit_transform(features_anomaly)
    
    # DBSCAN: smaller eps and min_samples=3 to flag outliers (label = -1)
    dbscan = DBSCAN(eps=1.5, min_samples=3)
    dbscan_labels = dbscan.fit_predict(scaled_anomaly)
    
    # Outliers have label -1
    anomaly_indices = np.where(dbscan_labels == -1)[0]
    
    for idx in anomaly_indices:
        row = df.iloc[idx]
        results["anomalies"].append({
            "transaction_id": str(row['id']),
            "score": 0.85, # Confidence score
            "amount": float(row['amount']),
            "category": row['category'],
            "date": row['date'],
            "description": row['description']
        })
        
    results["n_clusters"] = n_spending_clusters + n_size_clusters + n_temp_clusters + n_cat_clusters
    results["inertia"] = float(kmeans_spending.inertia_)
    
    # Write output to stdout
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
