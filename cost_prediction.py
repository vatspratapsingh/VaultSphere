import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

def train_cost_prediction(df):
    """
    Estimate monthly cloud cost based on resource usage features.
    Model Choice: Random Forest is used here to capture non-linear relationships between resources and costs.
    Societal Relevance: Accurate cost prediction helps startups manage their budgets effectively.
    """
    features = ['cpu_usage', 'memory_usage', 'api_requests']
    X = df[features]
    y = df['actual_cost']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    r2 = r2_score(y_test, predictions)
    
    # Visualization
    plt.figure(figsize=(8, 8))
    plt.scatter(y_test, predictions, alpha=0.5)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    plt.title('Cost Prediction: Actual vs Predicted')
    plt.xlabel('Actual Cost ($)')
    plt.ylabel('Predicted Cost ($)')
    plt.savefig('cost_prediction_accuracy.png')
    plt.close()
    
    return model, r2
