#!/usr/bin/env python3
"""
Analysis script for separate VaultSphere tenant datasets
Analyzes anomalies and patterns in the generated datasets.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from collections import Counter

def analyze_dataset(filename, tenant_name):
    """Analyze a single dataset for anomalies and patterns"""
    print(f"\n🔍 Analyzing {tenant_name} Dataset: {filename}")
    print("=" * 60)
    
    # Load dataset
    df = pd.read_csv(filename)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    
    # Basic statistics
    print(f"📊 Basic Statistics:")
    print(f"  Total Events: {len(df):,}")
    print(f"  Users: {df['user_id'].nunique()}")
    print(f"  Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"  Success Rate: {(df['status'] == 'SUCCESS').mean():.1%}")
    print(f"  Failure Rate: {(df['status'] == 'FAILURE').mean():.1%}")
    print(f"  Unique IPs: {df['ip_address'].nunique()}")
    
    # Event type distribution
    print(f"\n📈 Event Type Distribution:")
    event_dist = df['event_type'].value_counts()
    for event_type, count in event_dist.items():
        percentage = (count / len(df)) * 100
        print(f"  {event_type}: {count:,} ({percentage:.1f}%)")
    
    # Time pattern analysis
    print(f"\n⏰ Time Pattern Analysis:")
    business_hours = df[(df['hour'] >= 9) & (df['hour'] <= 17)]
    off_hours = df[(df['hour'] < 9) | (df['hour'] > 17)]
    night_hours = df[(df['hour'] >= 23) | (df['hour'] <= 5)]
    
    print(f"  Business Hours (9 AM - 5 PM): {len(business_hours):,} ({len(business_hours)/len(df)*100:.1f}%)")
    print(f"  Off Hours: {len(off_hours):,} ({len(off_hours)/len(df)*100:.1f}%)")
    print(f"  Night Hours (11 PM - 5 AM): {len(night_hours):,} ({len(night_hours)/len(df)*100:.1f}%)")
    
    # Failed login burst analysis
    print(f"\n🚨 Failed Login Burst Analysis:")
    failed_logins = df[(df['event_type'] == 'LOGIN') & (df['status'] == 'FAILURE')]
    
    if len(failed_logins) > 0:
        # Group by user and count consecutive failures
        user_failures = failed_logins.groupby('user_id').size().sort_values(ascending=False)
        burst_users = user_failures[user_failures >= 10]  # Users with 10+ failed logins
        
        print(f"  Total Failed Logins: {len(failed_logins):,}")
        print(f"  Users with Login Bursts (10+ failures): {len(burst_users)}")
        
        if len(burst_users) > 0:
            print(f"  Top Failed Login Users:")
            for user, count in burst_users.head(5).items():
                print(f"    {user}: {count} failed attempts")
    
    # Suspicious IP analysis
    print(f"\n🌐 IP Address Analysis:")
    ip_stats = df.groupby('ip_address').agg({
        'status': lambda x: (x == 'FAILURE').sum(),
        'user_id': 'count'
    }).rename(columns={'status': 'failures', 'user_id': 'total_events'})
    
    ip_stats['failure_rate'] = ip_stats['failures'] / ip_stats['total_events']
    suspicious_ips = ip_stats[ip_stats['failure_rate'] > 0.5]  # >50% failure rate
    
    print(f"  Total Unique IPs: {len(ip_stats)}")
    print(f"  Suspicious IPs (>50% failure rate): {len(suspicious_ips)}")
    
    if len(suspicious_ips) > 0:
        print(f"  Top Suspicious IPs:")
        for ip, stats in suspicious_ips.head(5).iterrows():
            print(f"    {ip}: {stats['failures']}/{stats['total_events']} failures ({stats['failure_rate']:.1%})")
    
    # Tenant-specific anomaly analysis
    if 'COMPLAINT' in df['event_type'].values:
        print(f"\n📞 Complaint Analysis (Food Company):")
        complaints = df[df['event_type'] == 'COMPLAINT']
        user_complaints = complaints.groupby('user_id').size().sort_values(ascending=False)
        excessive_complainers = user_complaints[user_complaints >= 8]  # 8+ complaints
        
        print(f"  Total Complaints: {len(complaints):,}")
        print(f"  Users with Excessive Complaints (8+): {len(excessive_complainers)}")
        
        if len(excessive_complainers) > 0:
            print(f"  Top Complainers:")
            for user, count in excessive_complainers.head(5).items():
                print(f"    {user}: {count} complaints")
    
    if 'ADMIN_ACTION' in df['event_type'].values:
        print(f"\n🔐 Admin Action Analysis (IT Solutions):")
        admin_actions = df[df['event_type'] == 'ADMIN_ACTION']
        user_admin_actions = admin_actions.groupby('user_id').size().sort_values(ascending=False)
        
        print(f"  Total Admin Actions: {len(admin_actions):,}")
        print(f"  Users Performing Admin Actions: {len(user_admin_actions)}")
        
        if len(user_admin_actions) > 0:
            print(f"  Top Admin Action Users:")
            for user, count in user_admin_actions.head(5).items():
                print(f"    {user}: {count} admin actions")
    
    return df

def main():
    """Main analysis function"""
    print("🎯 VaultSphere Separate Dataset Analysis")
    print("=" * 60)
    
    # Analyze Food Company dataset
    food_df = analyze_dataset('vaultsphere_food.csv', 'Food Company')
    
    # Analyze IT Solutions dataset
    it_df = analyze_dataset('vaultsphere_it.csv', 'IT Solutions Company')
    
    # Combined analysis
    print(f"\n🎉 COMBINED ANALYSIS")
    print("=" * 60)
    print(f"Total Events Across Both Tenants: {len(food_df) + len(it_df):,}")
    print(f"Total Users: {food_df['user_id'].nunique() + it_df['user_id'].nunique()}")
    print(f"Combined Success Rate: {((food_df['status'] == 'SUCCESS').sum() + (it_df['status'] == 'SUCCESS').sum()) / (len(food_df) + len(it_df)):.1%}")
    
    print(f"\n✅ Analysis Complete! Both datasets are ready for:")
    print("  • Anomaly detection model training")
    print("  • Isolation Forest algorithms")
    print("  • LSTM Autoencoder models")
    print("  • Multi-tenant behavior analysis")

if __name__ == "__main__":
    main()