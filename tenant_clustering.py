import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def perform_tenant_clustering(tenant_stats):
    """
    Cluster tenants based on average resource usage.
    Model Choice: K-Means is a standard unsupervised learning model for behavior grouping.
    Societal Relevance: Identifying high consumers allows for better resource allocation and fair billing.
    """
    features = ['cpu_usage', 'memory_usage', 'api_requests']
    X = tenant_stats[features]
    
    # Scale features for K-Means
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # We choose 3 clusters: Low, Medium, High resource consumers
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    tenant_stats['cluster'] = kmeans.fit_transform(X_scaled).argmin(axis=1) # Simplified labeling
    
    # Map cluster numbers to labels (interpretable)
    # Note: K-means labels are arbitrary, but for 3 clusters we can manually map based on average CPU
    cluster_map = tenant_stats.groupby('cluster')['cpu_usage'].mean().sort_values().index
    label_map = {cluster_map[0]: 'Low Consumer', cluster_map[1]: 'Medium Consumer', cluster_map[2]: 'High Consumer'}
    tenant_stats['usage_level'] = tenant_stats['cluster'].map(label_map)
    
    # Visualization
    plt.figure(figsize=(10, 6))
    colors = {'Low Consumer': 'green', 'Medium Consumer': 'blue', 'High Consumer': 'red'}
    for level, group in tenant_stats.groupby('usage_level'):
        plt.scatter(group['cpu_usage'], group['api_requests'], 
                    label=level, color=colors[level], s=100)
        
    plt.title('Tenant Behavior Clustering')
    plt.xlabel('Average CPU Usage (%)')
    plt.ylabel('Average API Requests')
    plt.legend()
    plt.savefig('tenant_clusters.png')
    plt.close()
    
    return tenant_stats
