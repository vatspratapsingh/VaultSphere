import pandas as pd
import numpy as np

def load_data(file_path):
    """Load the CSV data and parse timestamps."""
    df = pd.read_csv(file_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df

def preprocess_for_forecasting(df):
    """
    Prepare data for forecasting by creating time-based features.
    Societal Relevance: Helps in reducing energy waste by predicting server demand.
    """
    # Create day number from start as a simple feature for linear regression
    start_date = df['timestamp'].min()
    df['day_index'] = (df['timestamp'] - start_date).dt.days
    return df

def preprocess_for_cost(df):
    """
    Calculate costs based on resource usage.
    Logic: CPU ($0.05/unit), Memory ($0.03/unit), API ($0.001/call)
    """
    df['actual_cost'] = (
        df['cpu_usage'] * 0.05 + 
        df['memory_usage'] * 0.03 + 
        df['api_requests'] * 0.001
    )
    return df

def aggregate_tenant_metrics(df):
    """
    Aggregate metrics per tenant for clustering.
    """
    tenant_stats = df.groupby('tenant_id').agg({
        'cpu_usage': 'mean',
        'memory_usage': 'mean',
        'api_requests': 'mean'
    }).reset_index()
    return tenant_stats
