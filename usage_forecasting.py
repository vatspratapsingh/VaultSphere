import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

def train_usage_forecast(df, tenant_id, target_col):
    """
    Predict future usage for a specific tenant using Linear Regression.
    Model Choice: Linear Regression is chosen for its simplicity and interpretability in academic settings.
    """
    tenant_data = df[df['tenant_id'] == tenant_id].copy()
    
    X = tenant_data[['day_index']]
    y = tenant_data[target_col]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    
    # Visualization
    plt.figure(figsize=(10, 6))
    plt.scatter(X_test, y_test, color='blue', label='Actual')
    plt.plot(X_test, predictions, color='red', linewidth=2, label='Predicted')
    plt.title(f'Usage Forecast for {tenant_id} ({target_col})')
    plt.xlabel('Day Index')
    plt.ylabel(target_col)
    plt.legend()
    plt.savefig(f'forecast_{tenant_id}_{target_col}.png')
    plt.close()
    
    return model, mse

def forecast_all_tenants(df):
    results = {}
    tenants = df['tenant_id'].unique()
    for tenant in tenants:
        model, mse = train_usage_forecast(df, tenant, 'cpu_usage')
        results[tenant] = mse
    return results
