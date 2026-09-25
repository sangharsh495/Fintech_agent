import sys
import json
import argparse
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── FastAPI Application Initialization ─────────────────────

app = FastAPI(
    title="FinFlow ML Behavioral Analytics Service",
    description="Unsupervised Behavioral Analytics (K-Means & DBSCAN) for Indian Retail Banking",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Data Models ───────────────────────────────────

class TransactionItem(BaseModel):
    id: Any
    date: str
    amount: float
    description: str
    category: str
    payment_method: Optional[str] = "upi"
    is_recurring: Optional[bool] = False

class ClusterRequest(BaseModel):
    userId: Optional[str] = "anonymous"
    transactions: List[TransactionItem]
    eps: Optional[float] = Field(default=0.5, description="DBSCAN epsilon anomaly radius")
    min_samples: Optional[int] = Field(default=3, description="DBSCAN minimum samples for core point")

# ─── Helper Functions ───────────────────────────────────────

def circular_encode(values, max_value):
    radians = 2 * np.pi * values / max_value
    return np.sin(radians), np.cos(radians)

def get_dominant_value(df, column):
    if df.empty or column not in df.columns:
        return "unknown"
    val = df[column].mode()
    return val.iloc[0] if not val.empty else "unknown"

def generate_color(index):
    colors = ["#6366f1", "#10b981", "#ec4899", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#14b8a6"]
    return colors[index % len(colors)]

# ─── Core Analytical Engine ─────────────────────────────────

def process_clustering(txns_raw: list, user_id: str = "anonymous", eps: float = 0.5, min_samples: int = 3) -> dict:
    if len(txns_raw) < 5:
        return {"error": "Insufficient transactions for clustering (minimum 5 required)"}

    df = pd.DataFrame(txns_raw)

    # Ensure required columns exist
    if "payment_method" not in df.columns:
        df["payment_method"] = "upi"
    else:
        df["payment_method"] = df["payment_method"].fillna("upi")

    if "category" not in df.columns:
        df["category"] = "general"
    else:
        df["category"] = df["category"].fillna("general")

    if "description" not in df.columns:
        df["description"] = "Transaction"

    # Process dates, hours, and days
    df["parsed_date"] = pd.to_datetime(df["date"])
    df["day_of_week"] = df["parsed_date"].dt.dayofweek
    df["hour_of_day"] = df["parsed_date"].dt.hour

    # Circular encode day_of_week and hour_of_day
    day_sin, day_cos = circular_encode(df["day_of_week"], 7)
    hour_sin, hour_cos = circular_encode(df["hour_of_day"], 24)

    df["day_sin"] = day_sin
    df["day_cos"] = day_cos
    df["hour_sin"] = hour_sin
    df["hour_cos"] = hour_cos

    # Results structure
    results = {
        "algorithm": "kmeans",
        "n_clusters": 0,
        "silhouette_score": 0.0,
        "inertia": 0.0,
        "total_transactions": len(df),
        "parameters": {"init": "k-means++", "random_state": 42, "dbscan_eps": eps, "dbscan_min_samples": min_samples},
        "clusters": {},
        "metadata": {},
        "anomalies": [],
    }

    # ── 1. SPENDING BEHAVIOR CLUSTERING ──
    df["amount_log"] = np.log1p(df["amount"].astype(float))
    features_spending = df[["amount_log", "day_sin", "day_cos", "hour_sin", "hour_cos"]].values
    scaler = StandardScaler()
    scaled_spending = scaler.fit_transform(features_spending)

    n_spending_clusters = min(4, len(df))
    kmeans_spending = KMeans(n_clusters=n_spending_clusters, random_state=42, n_init=10)
    df["spending_cluster_id"] = kmeans_spending.fit_predict(scaled_spending)

    results["clusters"]["spending_behavior"] = {}
    results["metadata"]["spending_behavior"] = {}

    for c_id in range(n_spending_clusters):
        c_txns = df[df["spending_cluster_id"] == c_id]
        txn_ids = [str(x) for x in c_txns["id"].tolist()]
        results["clusters"]["spending_behavior"][str(c_id)] = txn_ids

        avg_amt = float(c_txns["amount"].mean())
        total_amt = float(c_txns["amount"].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, "category")
        dom_pay = get_dominant_value(c_txns, "payment_method")

        results["metadata"]["spending_behavior"][str(c_id)] = {
            "label": f"Behavior Cluster {c_id + 1}",
            "description": f"Average ticket size ₹{avg_amt:,.0f} mainly spent on {dom_cat.replace('_', ' ')} via {dom_pay.upper()}.",
            "color": generate_color(c_id),
            "centroid": kmeans_spending.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns["amount"].min()),
            "max_amount": float(c_txns["amount"].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage,
        }

    # ── 2. TRANSACTION SIZE CLUSTERING ──
    features_size = df[["amount"]].values
    n_size_clusters = min(4, len(df))
    kmeans_size = KMeans(n_clusters=n_size_clusters, random_state=42, n_init=10)
    df["size_cluster_raw"] = kmeans_size.fit_predict(features_size)

    centers = kmeans_size.cluster_centers_.flatten()
    sorted_idx = np.argsort(centers)
    size_mapping = {sorted_idx[i]: i for i in range(len(sorted_idx))}
    df["size_cluster_id"] = df["size_cluster_raw"].map(size_mapping)

    results["clusters"]["transaction_size"] = {}
    results["metadata"]["transaction_size"] = {}
    size_labels = ["Micro Transactions", "Standard Expenses", "High-value Purchases", "Major Transactions"]
    size_colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]

    for c_id in range(n_size_clusters):
        c_txns = df[df["size_cluster_id"] == c_id]
        txn_ids = [str(x) for x in c_txns["id"].tolist()]
        results["clusters"]["transaction_size"][str(c_id)] = txn_ids

        avg_amt = float(c_txns["amount"].mean())
        total_amt = float(c_txns["amount"].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, "category")
        dom_pay = get_dominant_value(c_txns, "payment_method")

        results["metadata"]["transaction_size"][str(c_id)] = {
            "label": size_labels[c_id] if c_id < len(size_labels) else f"Size Category {c_id + 1}",
            "description": f"Transactions ranging from ₹{c_txns['amount'].min():,.0f} to ₹{c_txns['amount'].max():,.0f}.",
            "color": size_colors[c_id] if c_id < len(size_colors) else generate_color(c_id + 4),
            "centroid": [float(centers[sorted_idx[c_id]])],
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns["amount"].min()),
            "max_amount": float(c_txns["amount"].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage,
        }

    # ── 3. TEMPORAL CLUSTERING ──
    features_temp = df[["day_sin", "day_cos", "hour_sin", "hour_cos"]].values
    n_temp_clusters = min(3, len(df))
    kmeans_temp = KMeans(n_clusters=n_temp_clusters, random_state=42, n_init=10)
    df["temp_cluster_id"] = kmeans_temp.fit_predict(features_temp)

    results["clusters"]["temporal"] = {}
    results["metadata"]["temporal"] = {}
    temp_labels = ["Weekday Spending", "Weekend Outings", "Late Night Activities"]
    temp_colors = ["#8b5cf6", "#ec4899", "#0f172a"]

    for c_id in range(n_temp_clusters):
        c_txns = df[df["temp_cluster_id"] == c_id]
        txn_ids = [str(x) for x in c_txns["id"].tolist()]
        results["clusters"]["temporal"][str(c_id)] = txn_ids

        avg_amt = float(c_txns["amount"].mean())
        total_amt = float(c_txns["amount"].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, "category")
        dom_pay = get_dominant_value(c_txns, "payment_method")

        results["metadata"]["temporal"][str(c_id)] = {
            "label": temp_labels[c_id] if c_id < len(temp_labels) else f"Time Pattern {c_id + 1}",
            "description": f"Transactions occurring during standard patterns (dominant: {dom_cat.replace('_', ' ')}).",
            "color": temp_colors[c_id] if c_id < len(temp_colors) else generate_color(c_id + 2),
            "centroid": kmeans_temp.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns["amount"].min()),
            "max_amount": float(c_txns["amount"].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage,
        }

    # ── 4. CATEGORY AFFINITY CLUSTERING ──
    df_cat_dummies = pd.get_dummies(df["category"])
    n_cat_clusters = min(3, len(df))
    kmeans_cat = KMeans(n_clusters=n_cat_clusters, random_state=42, n_init=10)
    df["cat_cluster_id"] = kmeans_cat.fit_predict(df_cat_dummies.values)

    results["clusters"]["category_affinity"] = {}
    results["metadata"]["category_affinity"] = {}

    for c_id in range(n_cat_clusters):
        c_txns = df[df["cat_cluster_id"] == c_id]
        txn_ids = [str(x) for x in c_txns["id"].tolist()]
        results["clusters"]["category_affinity"][str(c_id)] = txn_ids

        avg_amt = float(c_txns["amount"].mean())
        total_amt = float(c_txns["amount"].sum())
        percentage = round((len(c_txns) / len(df)) * 100, 1)
        dom_cat = get_dominant_value(c_txns, "category")
        dom_pay = get_dominant_value(c_txns, "payment_method")

        results["metadata"]["category_affinity"][str(c_id)] = {
            "label": f"{dom_cat.replace('_', ' ').title()} Hub",
            "description": f"Transactions clustered heavily around {dom_cat.replace('_', ' ')} purchases.",
            "color": generate_color(c_id + 5),
            "centroid": kmeans_cat.cluster_centers_[c_id].tolist(),
            "transaction_count": len(c_txns),
            "total_amount": total_amt,
            "avg_amount": avg_amt,
            "min_amount": float(c_txns["amount"].min()),
            "max_amount": float(c_txns["amount"].max()),
            "dominant_category": dom_cat,
            "dominant_payment_method": dom_pay,
            "percentage_of_total": percentage,
        }

    # ── 5. ANOMALY DETECTION (DBSCAN) ──
    features_anomaly = df[["amount_log", "hour_sin", "hour_cos"]].values
    scaled_anomaly = StandardScaler().fit_transform(features_anomaly)

    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    dbscan_labels = dbscan.fit_predict(scaled_anomaly)

    anomaly_indices = np.where(dbscan_labels == -1)[0]

    for idx in anomaly_indices:
        row = df.iloc[idx]
        results["anomalies"].append({
            "transaction_id": str(row["id"]),
            "score": 0.88,
            "amount": float(row["amount"]),
            "category": row["category"],
            "date": str(row["date"]),
            "description": str(row["description"]),
        })

    results["n_clusters"] = n_spending_clusters + n_size_clusters + n_temp_clusters + n_cat_clusters
    results["inertia"] = float(kmeans_spending.inertia_)

    return results

# ─── FastAPI Endpoints ──────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "finflow-ml-analytics",
        "version": "1.0.0",
        "algorithms": ["kmeans-spending", "kmeans-size", "kmeans-temporal", "kmeans-category", "dbscan-anomaly"],
        "invariants": {
            "dbscan_eps": 0.5,
            "dbscan_min_samples": 3,
        },
    }

@app.post("/cluster")
def cluster_endpoint(req: ClusterRequest):
    txns = [t.model_dump() for t in req.transactions]
    if len(txns) < 5:
        raise HTTPException(status_code=400, detail="Insufficient transactions for clustering (minimum 5 required)")
    return process_clustering(
        txns,
        req.userId or "anonymous",
        eps=req.eps or 0.5,
        min_samples=req.min_samples or 3,
    )

@app.post("/anomalies")
def anomalies_endpoint(req: ClusterRequest):
    txns = [t.model_dump() for t in req.transactions]
    if len(txns) < 5:
        raise HTTPException(status_code=400, detail="Insufficient transactions for anomaly detection")
    results = process_clustering(
        txns,
        req.userId or "anonymous",
        eps=req.eps or 0.5,
        min_samples=req.min_samples or 3,
    )
    return {
        "userId": req.userId,
        "total_transactions": len(txns),
        "anomalies": results.get("anomalies", []),
        "anomaly_count": len(results.get("anomalies", [])),
    }

# ─── CLI Entrypoint (Backward Compatibility) ────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="FinFlow Transaction Clustering ML Service")
    parser.add_argument("--file", required=False, help="Path to input transactions JSON file")
    parser.add_argument("--userId", required=False, default="anonymous", help="User ID to process")
    parser.add_argument("--eps", type=float, default=0.5, help="DBSCAN epsilon anomaly radius")
    parser.add_argument("--min_samples", type=int, default=3, help="DBSCAN min_samples parameter")
    return parser.parse_args()

def main():
    args = parse_args()
    if not args.file:
        print(json.dumps({"error": "No input file provided. Use --file <path> or run as FastAPI with uvicorn app.main:app --port 8000"}))
        return

    try:
        with open(args.file, "r") as f:
            input_data = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input JSON: {str(e)}"}))
        return

    txns_raw = input_data.get("transactions", [])
    if len(txns_raw) < 5:
        print(json.dumps({"error": "Insufficient transactions for clustering"}))
        return

    results = process_clustering(txns_raw, args.userId, eps=args.eps, min_samples=args.min_samples)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
