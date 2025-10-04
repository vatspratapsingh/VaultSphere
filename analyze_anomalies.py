#!/usr/bin/env python3
"""
VaultSphere Anomaly Detection Analysis
Demonstrates how to detect the injected anomalies in the synthetic logs.

Author: VaultSphere Development Team
Date: 2025-09-25
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

class VaultSphereAnomalyDetector:
    def __init__(self, csv_file='synthetic_vaultsphere_logs.csv'):
        """Initialize the anomaly detector with the log data"""
        print("🔍 Loading VaultSphere logs for anomaly detection...")
        self.df = pd.read_csv(csv_file)
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        print(f"Loaded {len(self.df):,} events from {csv_file}")
        
    def detect_failed_login_bursts(self, threshold=10, time_window_minutes=60):
        """Detect bursts of failed login attempts (potential brute force attacks)"""
        print(f"\n🚨 Detecting Failed Login Bursts (>{threshold} failures in {time_window_minutes} min)")
        print("-" * 70)
        
        # Filter failed login attempts
        failed_logins = self.df[
            (self.df['event_type'] == 'LOGIN') & 
            (self.df['status'] == 'FAILURE')
        ].copy()
        
        if failed_logins.empty:
            print("No failed login attempts found.")
            return []
        
        # Group by user and analyze time windows
        anomalies = []
        
        for user_id in failed_logins['user_id'].unique():
            user_failures = failed_logins[failed_logins['user_id'] == user_id].sort_values('timestamp')
            
            if len(user_failures) < threshold:
                continue
                
            # Check for bursts within time windows
            for i in range(len(user_failures)):
                window_start = user_failures.iloc[i]['timestamp']
                window_end = window_start + timedelta(minutes=time_window_minutes)
                
                window_failures = user_failures[
                    (user_failures['timestamp'] >= window_start) & 
                    (user_failures['timestamp'] <= window_end)
                ]
                
                if len(window_failures) >= threshold:
                    # Get unique IPs in this burst
                    burst_ips = window_failures['ip_address'].unique()
                    
                    anomaly = {
                        'user_id': user_id,
                        'tenant_id': user_failures.iloc[0]['tenant_id'],
                        'start_time': window_start,
                        'end_time': window_failures['timestamp'].max(),
                        'failure_count': len(window_failures),
                        'unique_ips': len(burst_ips),
                        'suspicious_ips': list(burst_ips)
                    }
                    anomalies.append(anomaly)
                    break  # Only report the first burst per user
        
        # Display results
        if anomalies:
            print(f"Found {len(anomalies)} potential brute force attacks:")
            for i, anomaly in enumerate(anomalies, 1):
                duration = (anomaly['end_time'] - anomaly['start_time']).total_seconds() / 60
                print(f"\n  {i}. User: {anomaly['user_id']} (Tenant {anomaly['tenant_id']})")
                print(f"     Time: {anomaly['start_time'].strftime('%Y-%m-%d %H:%M')} - {anomaly['end_time'].strftime('%H:%M')}")
                print(f"     Duration: {duration:.1f} minutes")
                print(f"     Failed attempts: {anomaly['failure_count']}")
                print(f"     Unique IPs: {anomaly['unique_ips']}")
                print(f"     IPs: {', '.join(anomaly['suspicious_ips'][:3])}{'...' if len(anomaly['suspicious_ips']) > 3 else ''}")
        else:
            print("No failed login bursts detected.")
            
        return anomalies
    
    def detect_unusual_event_types(self):
        """Detect users performing unusual event types for their typical behavior"""
        print(f"\n🔍 Detecting Unusual Event Types")
        print("-" * 70)
        
        # Calculate typical event distribution per user
        user_profiles = {}
        
        for user_id in self.df['user_id'].unique():
            user_events = self.df[self.df['user_id'] == user_id]
            event_counts = user_events['event_type'].value_counts()
            total_events = len(user_events)
            
            # Calculate event type percentages
            event_percentages = {}
            for event_type in ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'DOWNLOAD']:
                count = event_counts.get(event_type, 0)
                percentage = (count / total_events) * 100 if total_events > 0 else 0
                event_percentages[event_type] = percentage
            
            user_profiles[user_id] = {
                'total_events': total_events,
                'event_percentages': event_percentages,
                'tenant_id': user_events.iloc[0]['tenant_id']
            }
        
        # Detect anomalies - users with unusually high DELETE percentages
        anomalies = []
        
        for user_id, profile in user_profiles.items():
            delete_percentage = profile['event_percentages']['DELETE']
            
            # Flag users with >2% DELETE events (unusual for most roles)
            if delete_percentage > 2.0 and profile['total_events'] > 50:
                delete_count = int((delete_percentage / 100) * profile['total_events'])
                
                anomaly = {
                    'user_id': user_id,
                    'tenant_id': profile['tenant_id'],
                    'delete_percentage': delete_percentage,
                    'delete_count': delete_count,
                    'total_events': profile['total_events']
                }
                anomalies.append(anomaly)
        
        # Sort by delete percentage
        anomalies.sort(key=lambda x: x['delete_percentage'], reverse=True)
        
        # Display results
        if anomalies:
            print(f"Found {len(anomalies)} users with unusual DELETE activity:")
            for i, anomaly in enumerate(anomalies[:10], 1):  # Show top 10
                print(f"\n  {i}. User: {anomaly['user_id']} (Tenant {anomaly['tenant_id']})")
                print(f"     DELETE events: {anomaly['delete_count']} ({anomaly['delete_percentage']:.1f}% of {anomaly['total_events']} total)")
                print(f"     Risk: {'HIGH' if anomaly['delete_percentage'] > 5 else 'MEDIUM'}")
        else:
            print("No unusual event type patterns detected.")
            
        return anomalies
    
    def detect_suspicious_ip_access(self):
        """Detect access from suspicious or unusual IP addresses"""
        print(f"\n🌐 Detecting Suspicious IP Access")
        print("-" * 70)
        
        # Analyze IP patterns per user
        user_ip_profiles = {}
        
        for user_id in self.df['user_id'].unique():
            user_events = self.df[self.df['user_id'] == user_id]
            ip_counts = user_events['ip_address'].value_counts()
            
            # Identify primary IPs (used >10% of the time)
            total_events = len(user_events)
            primary_ips = []
            suspicious_ips = []
            
            for ip, count in ip_counts.items():
                percentage = (count / total_events) * 100
                if percentage > 10:
                    primary_ips.append(ip)
                elif count >= 3:  # IPs used multiple times but infrequently
                    suspicious_ips.append((ip, count))
            
            user_ip_profiles[user_id] = {
                'tenant_id': user_events.iloc[0]['tenant_id'],
                'total_events': total_events,
                'unique_ips': len(ip_counts),
                'primary_ips': primary_ips,
                'suspicious_ips': suspicious_ips
            }
        
        # Detect anomalies
        anomalies = []
        
        for user_id, profile in user_ip_profiles.items():
            # Flag users with many unique IPs or suspicious access patterns
            if profile['unique_ips'] > 5 or len(profile['suspicious_ips']) > 2:
                anomaly = {
                    'user_id': user_id,
                    'tenant_id': profile['tenant_id'],
                    'unique_ips': profile['unique_ips'],
                    'primary_ips': profile['primary_ips'],
                    'suspicious_ips': profile['suspicious_ips'][:5],  # Top 5
                    'total_events': profile['total_events']
                }
                anomalies.append(anomaly)
        
        # Sort by number of unique IPs
        anomalies.sort(key=lambda x: x['unique_ips'], reverse=True)
        
        # Display results
        if anomalies:
            print(f"Found {len(anomalies)} users with suspicious IP patterns:")
            for i, anomaly in enumerate(anomalies[:10], 1):  # Show top 10
                print(f"\n  {i}. User: {anomaly['user_id']} (Tenant {anomaly['tenant_id']})")
                print(f"     Unique IPs: {anomaly['unique_ips']} across {anomaly['total_events']} events")
                print(f"     Primary IPs: {len(anomaly['primary_ips'])}")
                if anomaly['suspicious_ips']:
                    print(f"     Suspicious IPs: {', '.join([f'{ip}({count})' for ip, count in anomaly['suspicious_ips'][:3]])}")
        else:
            print("No suspicious IP access patterns detected.")
            
        return anomalies
    
    def detect_off_hours_activity(self):
        """Detect unusual activity during off-hours (11 PM - 5 AM)"""
        print(f"\n🌙 Detecting Off-Hours Activity")
        print("-" * 70)
        
        # Add hour column
        self.df['hour'] = self.df['timestamp'].dt.hour
        
        # Define off-hours (11 PM to 5 AM)
        off_hours = [23, 0, 1, 2, 3, 4, 5]
        
        # Analyze off-hours activity per user
        user_off_hours = {}
        
        for user_id in self.df['user_id'].unique():
            user_events = self.df[self.df['user_id'] == user_id]
            total_events = len(user_events)
            
            off_hours_events = user_events[user_events['hour'].isin(off_hours)]
            off_hours_count = len(off_hours_events)
            off_hours_percentage = (off_hours_count / total_events) * 100 if total_events > 0 else 0
            
            if off_hours_count > 5:  # Users with >5 off-hours events
                user_off_hours[user_id] = {
                    'tenant_id': user_events.iloc[0]['tenant_id'],
                    'total_events': total_events,
                    'off_hours_count': off_hours_count,
                    'off_hours_percentage': off_hours_percentage,
                    'off_hours_events': off_hours_events
                }
        
        # Sort by off-hours percentage
        anomalies = sorted(user_off_hours.items(), key=lambda x: x[1]['off_hours_percentage'], reverse=True)
        
        # Display results
        if anomalies:
            print(f"Found {len(anomalies)} users with significant off-hours activity:")
            for i, (user_id, data) in enumerate(anomalies[:10], 1):  # Show top 10
                print(f"\n  {i}. User: {user_id} (Tenant {data['tenant_id']})")
                print(f"     Off-hours events: {data['off_hours_count']} ({data['off_hours_percentage']:.1f}% of {data['total_events']} total)")
                
                # Show event type distribution during off-hours
                event_types = data['off_hours_events']['event_type'].value_counts()
                print(f"     Event types: {', '.join([f'{et}({count})' for et, count in event_types.head(3).items()])}")
                
                # Show time pattern
                hours = data['off_hours_events']['hour'].value_counts().sort_index()
                print(f"     Peak hours: {', '.join([f'{h}:00({count})' for h, count in hours.head(3).items()])}")
        else:
            print("No significant off-hours activity detected.")
            
        return anomalies
    
    def generate_summary_report(self):
        """Generate a comprehensive anomaly detection summary"""
        print("\n" + "="*80)
        print("🔒 VAULTSPHERE ANOMALY DETECTION SUMMARY REPORT")
        print("="*80)
        
        # Run all detection methods
        failed_login_anomalies = self.detect_failed_login_bursts()
        unusual_event_anomalies = self.detect_unusual_event_types()
        suspicious_ip_anomalies = self.detect_suspicious_ip_access()
        off_hours_anomalies = self.detect_off_hours_activity()
        
        # Summary statistics
        print(f"\n📊 DETECTION SUMMARY:")
        print("-" * 40)
        print(f"Failed Login Bursts: {len(failed_login_anomalies)} detected")
        print(f"Unusual Event Types: {len(unusual_event_anomalies)} users flagged")
        print(f"Suspicious IP Access: {len(suspicious_ip_anomalies)} users flagged")
        print(f"Off-Hours Activity: {len(off_hours_anomalies)} users flagged")
        
        # Risk assessment
        total_anomalies = (len(failed_login_anomalies) + len(unusual_event_anomalies) + 
                          len(suspicious_ip_anomalies) + len(off_hours_anomalies))
        
        print(f"\n🎯 RISK ASSESSMENT:")
        print("-" * 40)
        if total_anomalies > 50:
            risk_level = "HIGH"
        elif total_anomalies > 20:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        print(f"Overall Risk Level: {risk_level}")
        print(f"Total Anomalies Detected: {total_anomalies}")
        print(f"Anomaly Rate: {(total_anomalies / len(self.df)) * 100:.2f}% of all events")
        
        print(f"\n💡 RECOMMENDATIONS:")
        print("-" * 40)
        if len(failed_login_anomalies) > 0:
            print("• Implement stronger rate limiting for login attempts")
            print("• Consider IP-based blocking for repeated failures")
        if len(unusual_event_anomalies) > 0:
            print("• Review user permissions and role assignments")
            print("• Implement approval workflows for DELETE operations")
        if len(suspicious_ip_anomalies) > 0:
            print("• Implement geo-location monitoring")
            print("• Require additional authentication for new IP addresses")
        if len(off_hours_anomalies) > 0:
            print("• Monitor off-hours access more closely")
            print("• Consider requiring manager approval for off-hours work")
        
        print("\n🎉 Anomaly detection analysis completed!")
        return {
            'failed_logins': failed_login_anomalies,
            'unusual_events': unusual_event_anomalies,
            'suspicious_ips': suspicious_ip_anomalies,
            'off_hours': off_hours_anomalies
        }

def main():
    """Main execution function"""
    print("🔍 VaultSphere Anomaly Detection Analysis")
    print("Analyzing synthetic logs for security anomalies...")
    print("=" * 80)
    
    # Create detector instance
    detector = VaultSphereAnomalyDetector()
    
    # Generate comprehensive report
    results = detector.generate_summary_report()
    
    return results

if __name__ == "__main__":
    results = main()