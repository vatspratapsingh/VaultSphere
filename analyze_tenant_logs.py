#!/usr/bin/env python3
"""
VaultSphere Tenant Log Analysis Script
Analyzes the generated synthetic logs for anomalies and patterns.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from collections import Counter

def load_and_analyze_logs(filename='synthetic_vaultsphere_logs.csv'):
    """Load and analyze the synthetic logs"""
    print("🔍 VaultSphere Tenant Log Analysis")
    print("=" * 50)
    
    # Load the data
    df = pd.read_csv(filename)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    print(f"📊 Loaded {len(df):,} events from {filename}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Basic statistics
    print("\n🏢 Tenant Analysis:")
    for tenant_id in sorted(df['tenant_id'].unique()):
        tenant_data = df[df['tenant_id'] == tenant_id]
        tenant_name = "Food Company" if tenant_id == 1 else "IT Solutions Company"
        
        print(f"\nTenant {tenant_id} ({tenant_name}):")
        print(f"  Total events: {len(tenant_data):,}")
        print(f"  Unique users: {tenant_data['user_id'].nunique()}")
        print(f"  Success rate: {(tenant_data['status'] == 'SUCCESS').mean():.1%}")
        print(f"  Top event types:")
        
        event_counts = tenant_data['event_type'].value_counts().head(3)
        for event_type, count in event_counts.items():
            percentage = (count / len(tenant_data)) * 100
            print(f"    {event_type}: {count:,} ({percentage:.1f}%)")
    
    return df

def detect_anomalies(df):
    """Detect various types of anomalies in the logs"""
    print("\n🚨 Anomaly Detection Results:")
    print("-" * 40)
    
    # 1. Failed login bursts
    failed_logins = df[(df['event_type'] == 'LOGIN') & (df['status'] == 'FAILURE')]
    
    if not failed_logins.empty:
        # Group by user and count failures
        user_failures = failed_logins.groupby('user_id').size()
        suspicious_users = user_failures[user_failures >= 10]  # 10+ failed logins
        
        print(f"1. Failed Login Bursts:")
        print(f"   Users with 10+ failed logins: {len(suspicious_users)}")
        if len(suspicious_users) > 0:
            print(f"   Max failures by single user: {user_failures.max()}")
            print(f"   Top suspicious users:")
            for user_id, count in suspicious_users.head(5).items():
                tenant_id = df[df['user_id'] == user_id]['tenant_id'].iloc[0]
                tenant_name = "Food Company" if tenant_id == 1 else "IT Solutions"
                print(f"     {user_id} ({tenant_name}): {count} failed logins")
    
    # 2. Off-hours activity (11 PM - 5 AM)
    df['hour'] = df['timestamp'].dt.hour
    off_hours_mask = (df['hour'] >= 23) | (df['hour'] <= 5)
    off_hours_events = df[off_hours_mask]
    
    print(f"\n2. Off-Hours Activity (11 PM - 5 AM):")
    print(f"   Total off-hours events: {len(off_hours_events):,}")
    print(f"   Percentage of all events: {(len(off_hours_events) / len(df)) * 100:.1f}%")
    
    if not off_hours_events.empty:
        off_hours_users = off_hours_events.groupby('user_id').size()
        active_users = off_hours_users[off_hours_users >= 5]  # 5+ off-hours events
        print(f"   Users with 5+ off-hours events: {len(active_users)}")
        
        if len(active_users) > 0:
            print(f"   Top off-hours users:")
            for user_id, count in active_users.head(5).items():
                tenant_id = df[df['user_id'] == user_id]['tenant_id'].iloc[0]
                tenant_name = "Food Company" if tenant_id == 1 else "IT Solutions"
                print(f"     {user_id} ({tenant_name}): {count} off-hours events")
    
    # 3. Unusual event patterns by tenant
    print(f"\n3. Tenant-Specific Anomalies:")
    
    # Food Company - excessive complaints
    food_complaints = df[(df['tenant_id'] == 1) & (df['event_type'] == 'COMPLAINT')]
    if not food_complaints.empty:
        complaint_users = food_complaints.groupby('user_id').size()
        excessive_complainers = complaint_users[complaint_users >= 8]
        print(f"   Food Company - Users with 8+ complaints: {len(excessive_complainers)}")
        
        if len(excessive_complainers) > 0:
            max_complaints = complaint_users.max()
            print(f"   Max complaints by single user: {max_complaints}")
    
    # IT Solutions - unauthorized admin actions
    it_admin_actions = df[(df['tenant_id'] == 2) & (df['event_type'] == 'ADMIN_ACTION')]
    if not it_admin_actions.empty:
        admin_users = it_admin_actions['user_id'].nunique()
        print(f"   IT Solutions - Users performing admin actions: {admin_users}")
        
        # Check for non-admin users doing admin actions (this would be detected by role analysis)
        admin_action_counts = it_admin_actions.groupby('user_id').size()
        frequent_admin_users = admin_action_counts[admin_action_counts >= 3]
        print(f"   Users with 3+ admin actions: {len(frequent_admin_users)}")
    
    # 4. Suspicious IP patterns
    print(f"\n4. IP Address Analysis:")
    unique_ips = df['ip_address'].nunique()
    print(f"   Total unique IP addresses: {unique_ips}")
    
    # Look for IPs with high failure rates
    ip_stats = df.groupby('ip_address').agg({
        'status': ['count', lambda x: (x == 'FAILURE').sum()]
    }).round(2)
    ip_stats.columns = ['total_events', 'failures']
    ip_stats['failure_rate'] = (ip_stats['failures'] / ip_stats['total_events']).round(3)
    
    suspicious_ips = ip_stats[
        (ip_stats['failure_rate'] > 0.5) & (ip_stats['total_events'] >= 5)
    ].sort_values('failure_rate', ascending=False)
    
    print(f"   IPs with >50% failure rate (5+ events): {len(suspicious_ips)}")
    if len(suspicious_ips) > 0:
        print(f"   Top suspicious IPs:")
        for ip, stats in suspicious_ips.head(5).iterrows():
            print(f"     {ip}: {stats['failure_rate']:.1%} failure rate ({stats['total_events']} events)")

def generate_summary_report(df):
    """Generate a comprehensive summary report"""
    print("\n📋 Summary Report:")
    print("=" * 50)
    
    # Overall statistics
    total_events = len(df)
    success_rate = (df['status'] == 'SUCCESS').mean()
    failure_rate = 1 - success_rate
    
    print(f"Dataset Overview:")
    print(f"  Total Events: {total_events:,}")
    print(f"  Success Rate: {success_rate:.1%}")
    print(f"  Failure Rate: {failure_rate:.1%}")
    print(f"  Date Range: {(df['timestamp'].max() - df['timestamp'].min()).days} days")
    
    # Tenant comparison
    print(f"\nTenant Comparison:")
    tenant_stats = df.groupby('tenant_id').agg({
        'user_id': 'nunique',
        'event_type': 'count',
        'status': lambda x: (x == 'SUCCESS').mean()
    }).round(3)
    tenant_stats.columns = ['users', 'events', 'success_rate']
    
    for tenant_id, stats in tenant_stats.iterrows():
        tenant_name = "Food Company" if tenant_id == 1 else "IT Solutions Company"
        print(f"  {tenant_name}:")
        print(f"    Users: {stats['users']}")
        print(f"    Events: {stats['events']:,}")
        print(f"    Success Rate: {stats['success_rate']:.1%}")
    
    # Time patterns
    df['hour'] = df['timestamp'].dt.hour
    business_hours = df[(df['hour'] >= 9) & (df['hour'] <= 17)]
    off_hours = df[(df['hour'] < 9) | (df['hour'] > 17)]
    
    print(f"\nTime Patterns:")
    print(f"  Business Hours (9 AM - 5 PM): {len(business_hours):,} events ({len(business_hours)/total_events:.1%})")
    print(f"  Off Hours: {len(off_hours):,} events ({len(off_hours)/total_events:.1%})")
    
    print(f"\n✅ Analysis completed successfully!")
    print(f"The dataset contains realistic patterns with injected anomalies suitable for")
    print(f"anomaly detection research and security monitoring system development.")

def main():
    """Main analysis function"""
    try:
        # Load and analyze the logs
        df = load_and_analyze_logs()
        
        # Detect anomalies
        detect_anomalies(df)
        
        # Generate summary report
        generate_summary_report(df)
        
    except FileNotFoundError:
        print("❌ Error: synthetic_vaultsphere_logs.csv not found!")
        print("Please run generate_synthetic_logs.py first to create the dataset.")
    except Exception as e:
        print(f"❌ Error during analysis: {e}")

if __name__ == "__main__":
    main()