from data_preprocessing import load_data, preprocess_for_forecasting, preprocess_for_cost, aggregate_tenant_metrics
from usage_forecasting import forecast_all_tenants
from cost_prediction import train_cost_prediction
from tenant_clustering import perform_tenant_clustering
import pandas as pd

def run_ml_pipeline():
    print("🚀 Starting VaultSphere ML Pipeline...")
    
    # 1. Load and Preprocess
    print("📦 Loading and preprocessing data...")
    raw_df = load_data('tenant_resource_usage.csv')
    df = preprocess_for_forecasting(raw_df)
    df = preprocess_for_cost(df)
    
    # 2. Usage Forecasting
    print("📈 Running Usage Forecasting...")
    forecast_results = forecast_all_tenants(df)
    print(f"   Forecasting complete. Avg MSE: {sum(forecast_results.values())/len(forecast_results):.2f}")
    
    # 3. Cost Prediction
    print("💰 Running Cost Prediction...")
    cost_model, r2 = train_cost_prediction(df)
    print(f"   Cost Prediction R2 Score: {r2:.4f}")
    
    # 4. Tenant Clustering
    print("👥 Running Tenant Behavior Clustering...")
    tenant_stats = aggregate_tenant_metrics(df)
    clustered_tenants = perform_tenant_clustering(tenant_stats)
    print("\n--- Tenant Clustering Summary ---")
    print(clustered_tenants[['tenant_id', 'usage_level', 'cpu_usage']])
    
    print("\n✅ ML Pipeline completed successfully!")
    print("📊 All plots have been saved as PNG files in the current directory.")

if __name__ == "__main__":
    run_ml_pipeline()
