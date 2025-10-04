#!/usr/bin/env python3
"""
VaultSphere Separate Tenant Dataset Generator
Generates separate realistic datasets for Food Company and IT Solutions Company.

Author: VaultSphere Development Team
Date: 2025-09-25
"""

import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta
import ipaddress
import os

# Initialize Faker for generating realistic data
fake = Faker()
Faker.seed(42)  # For reproducible results
random.seed(42)
np.random.seed(42)

class SeparateTenantDatasetGenerator:
    def __init__(self):
        self.days_back = 30
        
        # Define tenant-specific configurations
        self.tenant_configs = {
            'food': {
                'name': 'Food Company',
                'email': 'food@vaultsphere.com',
                'password': 'food123',
                'tenant_id': 1,
                'users': 40,
                'events_per_user': 150,
                'event_types': {
                    'LOGIN': 0.30,
                    'ORDER': 0.25,
                    'PAYMENT': 0.20,
                    'UPDATE': 0.15,
                    'COMPLAINT': 0.10
                },
                'filename': 'vaultsphere_food.csv'
            },
            'it': {
                'name': 'IT Solutions Company',
                'email': 'it@vaultsphere.com',
                'password': 'it123',
                'tenant_id': 2,
                'users': 50,
                'events_per_user': 200,
                'event_types': {
                    'LOGIN': 0.25,
                    'UPLOAD': 0.25,
                    'DOWNLOAD': 0.25,
                    'UPDATE': 0.15,
                    'ADMIN_ACTION': 0.10
                },
                'filename': 'vaultsphere_it.csv'
            }
        }
        
        # User roles and their typical behaviors
        self.user_roles = {
            'manager': 0.15,    # 15% managers
            'employee': 0.70,   # 70% regular employees
            'admin': 0.10,      # 10% admins
            'guest': 0.05       # 5% guest users
        }
        
        # IP address pools for different scenarios
        self.corporate_ips = self._generate_corporate_ips()
        self.home_ips = self._generate_home_ips()
        self.suspicious_ips = self._generate_suspicious_ips()
        
    def _generate_corporate_ips(self):
        """Generate corporate IP ranges (typically 10.x.x.x, 192.168.x.x)"""
        corporate_ips = []
        # Corporate network ranges
        for _ in range(20):
            corporate_ips.append(f"10.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}")
        for _ in range(15):
            corporate_ips.append(f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}")
        return corporate_ips
    
    def _generate_home_ips(self):
        """Generate home/remote IP addresses"""
        home_ips = []
        for _ in range(100):
            # Generate realistic public IP ranges
            first_octet = random.choice([24, 50, 73, 98, 173, 184, 208])
            home_ips.append(f"{first_octet}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}")
        return home_ips
    
    def _generate_suspicious_ips(self):
        """Generate suspicious IP addresses from various countries"""
        suspicious_ips = []
        # Known suspicious ranges and international IPs
        suspicious_ranges = [
            "185.220.", "198.98.", "176.10.", "91.219.", "5.188.",
            "46.166.", "194.147.", "89.248.", "178.128.", "159.89."
        ]
        for base in suspicious_ranges:
            for _ in range(5):
                suspicious_ips.append(f"{base}{random.randint(1, 254)}.{random.randint(1, 254)}")
        return suspicious_ips
    
    def _create_users(self, tenant_key):
        """Create users for a specific tenant"""
        config = self.tenant_configs[tenant_key]
        users_data = {}
        num_users = config['users']
        tenant_id = config['tenant_id']
        
        print(f"Creating {num_users} users for {config['name']} (Tenant {tenant_id})")
        
        for user_id in range(1, num_users + 1):
            global_user_id = f"T{tenant_id:02d}U{user_id:03d}"
            
            # Assign role with realistic distribution
            role = np.random.choice(
                list(self.user_roles.keys()),
                p=list(self.user_roles.values())
            )
            
            # Assign typical IP addresses (80% corporate, 20% home)
            typical_ips = []
            if random.random() < 0.8:  # Corporate user
                typical_ips = random.sample(self.corporate_ips, min(3, len(self.corporate_ips)))
            else:  # Remote user
                typical_ips = random.sample(self.home_ips, min(2, len(self.home_ips)))
            
            users_data[global_user_id] = {
                'role': role,
                'typical_ips': typical_ips,
                'tenant_id': tenant_id,
                'local_user_id': user_id,
                'tenant_name': config['name']
            }
        
        return users_data
    
    def _generate_normal_events(self, user_id, user_info, num_events, tenant_config):
        """Generate normal user activity events"""
        events = []
        typical_ips = user_info['typical_ips']
        tenant_events = tenant_config['event_types']
        
        for _ in range(num_events):
            # Generate timestamp within the last 30 days
            days_ago = random.uniform(0, self.days_back)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            # Add realistic time patterns (more activity during business hours)
            if random.random() < 0.8:  # 80% during business hours (9 AM - 6 PM)
                business_hour = random.randint(9, 17)
                timestamp = timestamp.replace(hour=business_hour, minute=random.randint(0, 59))
            else:  # 20% outside business hours
                off_hour = random.choice([7, 8, 18, 19, 20, 21, 22])
                timestamp = timestamp.replace(hour=off_hour, minute=random.randint(0, 59))
            
            # Choose event type based on tenant
            event_type = np.random.choice(
                list(tenant_events.keys()),
                p=list(tenant_events.values())
            )
            
            # Generate resource ID (RES_1 to RES_1000 as requested)
            resource_id = f"RES_{random.randint(1, 1000)}"
            
            # Status (90% success for normal events, 10% failure as requested)
            status = 'SUCCESS' if random.random() < 0.90 else 'FAILURE'
            
            # IP address (mostly from typical IPs)
            ip_address = random.choice(typical_ips) if typical_ips else random.choice(self.corporate_ips)
            
            events.append({
                'timestamp': timestamp,
                'tenant_id': user_info['tenant_id'],
                'user_id': user_id,
                'event_type': event_type,
                'resource_id': resource_id,
                'status': status,
                'ip_address': ip_address
            })
        
        return events
    
    def _inject_failed_login_bursts(self, users_data, logs):
        """Inject bursts of failed login attempts (brute force simulation)"""
        print("  → Injecting failed login burst anomalies...")
        
        # Select 8 users for failed login bursts as specified
        all_users = list(users_data.items())
        num_anomaly_users = min(8, len(all_users))
        anomaly_users = random.sample(all_users, num_anomaly_users)
        
        for user_id, user_info in anomaly_users:
            # Generate burst of failed logins
            burst_start = datetime.now() - timedelta(days=random.uniform(1, 25))
            burst_duration = timedelta(minutes=random.randint(10, 120))
            
            # 10-36 failed login attempts as specified
            num_attempts = random.randint(10, 36)
            
            for i in range(num_attempts):
                timestamp = burst_start + timedelta(
                    seconds=random.uniform(0, burst_duration.total_seconds())
                )
                
                # Mix of suspicious and normal IPs during attack
                if random.random() < 0.6:  # 60% from suspicious IPs
                    ip_address = random.choice(self.suspicious_ips)
                else:
                    ip_address = random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                
                logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': 'LOGIN',
                    'resource_id': f"RES_{random.randint(1, 1000)}",
                    'status': 'FAILURE',
                    'ip_address': ip_address
                })
    
    def _inject_off_hours_activity(self, users_data, logs, tenant_config):
        """Inject off-hours activity (11 PM - 5 AM)"""
        print("  → Injecting off-hours activity anomalies...")
        
        # Select 30% of users for off-hours activity
        all_users = list(users_data.items())
        num_anomaly_users = max(5, int(len(all_users) * 0.3))
        anomaly_users = random.sample(all_users, num_anomaly_users)
        
        for user_id, user_info in anomaly_users:
            # Generate 5-12 off-hours events (targeting ~10% of total events)
            num_events = random.randint(5, 12)
            
            for _ in range(num_events):
                timestamp = datetime.now() - timedelta(days=random.uniform(1, 20))
                
                # Set to off hours (11 PM - 5 AM)
                off_hour = random.choice([23, 0, 1, 2, 3, 4, 5])
                timestamp = timestamp.replace(hour=off_hour, minute=random.randint(0, 59))
                
                # Choose appropriate event type based on tenant
                event_types = list(tenant_config['event_types'].keys())
                event_type = random.choice(event_types)
                
                logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': event_type,
                    'resource_id': f"RES_{random.randint(1, 1000)}",
                    'status': 'SUCCESS',
                    'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                })
    
    def _inject_tenant_specific_anomalies(self, users_data, logs, tenant_key):
        """Inject tenant-specific anomalies"""
        if tenant_key == 'food':
            print("  → Injecting excessive complaint anomalies...")
            # Select users for excessive complaints
            all_users = list(users_data.items())
            num_anomaly_users = max(3, int(len(all_users) * 0.1))
            anomaly_users = random.sample(all_users, num_anomaly_users)
            
            for user_id, user_info in anomaly_users:
                # Generate excessive complaints
                num_complaints = random.randint(8, 15)
                
                for _ in range(num_complaints):
                    timestamp = datetime.now() - timedelta(days=random.uniform(1, 28))
                    
                    logs.append({
                        'timestamp': timestamp,
                        'tenant_id': user_info['tenant_id'],
                        'user_id': user_id,
                        'event_type': 'COMPLAINT',
                        'resource_id': f"RES_{random.randint(1, 1000)}",
                        'status': 'SUCCESS',
                        'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                    })
        
        elif tenant_key == 'it':
            print("  → Injecting unauthorized admin action anomalies...")
            # Select non-admin users for unauthorized admin actions
            non_admin_users = [(user_id, user_info) for user_id, user_info in users_data.items() 
                              if user_info['role'] != 'admin']
            
            if non_admin_users:
                num_anomaly_users = max(2, int(len(non_admin_users) * 0.1))
                anomaly_users = random.sample(non_admin_users, num_anomaly_users)
                
                for user_id, user_info in anomaly_users:
                    # Generate 2-4 unauthorized admin actions
                    num_actions = random.randint(2, 4)
                    
                    for _ in range(num_actions):
                        timestamp = datetime.now() - timedelta(days=random.uniform(1, 28))
                        
                        logs.append({
                            'timestamp': timestamp,
                            'tenant_id': user_info['tenant_id'],
                            'user_id': user_id,
                            'event_type': 'ADMIN_ACTION',
                            'resource_id': f"RES_{random.randint(1, 1000)}",
                            'status': 'SUCCESS',
                            'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                        })
    
    def _inject_suspicious_ip_access(self, users_data, logs):
        """Inject access from suspicious IP addresses"""
        print("  → Injecting suspicious IP access anomalies...")
        
        # Select 20% of users for suspicious IP access
        all_users = list(users_data.items())
        num_anomaly_users = max(3, int(len(all_users) * 0.2))
        anomaly_users = random.sample(all_users, num_anomaly_users)
        
        for user_id, user_info in anomaly_users:
            # Generate 3-8 events from suspicious IPs
            num_events = random.randint(3, 8)
            
            for _ in range(num_events):
                timestamp = datetime.now() - timedelta(days=random.uniform(1, 25))
                
                # Random event type from tenant's available types
                tenant_config = self.tenant_configs['food'] if user_info['tenant_id'] == 1 else self.tenant_configs['it']
                event_type = random.choice(list(tenant_config['event_types'].keys()))
                
                # Higher failure rate for suspicious IPs
                status = 'FAILURE' if random.random() < 0.4 else 'SUCCESS'
                
                logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': event_type,
                    'resource_id': f"RES_{random.randint(1, 1000)}",
                    'status': status,
                    'ip_address': random.choice(self.suspicious_ips)
                })
    
    def generate_tenant_dataset(self, tenant_key):
        """Generate dataset for a specific tenant"""
        config = self.tenant_configs[tenant_key]
        print(f"\n🚀 Generating {config['name']} Dataset")
        print("=" * 50)
        
        # Step 1: Create users
        users_data = self._create_users(tenant_key)
        
        # Step 2: Generate normal events
        print(f"Generating normal events for {config['users']} users...")
        logs = []
        
        for user_id, user_info in users_data.items():
            normal_events = self._generate_normal_events(user_id, user_info, config['events_per_user'], config)
            logs.extend(normal_events)
        
        print(f"Generated {len(logs)} normal events")
        
        # Step 3: Inject anomalies
        print("\n🔍 Injecting realistic anomalies...")
        initial_count = len(logs)
        
        self._inject_failed_login_bursts(users_data, logs)
        self._inject_off_hours_activity(users_data, logs, config)
        self._inject_tenant_specific_anomalies(users_data, logs, tenant_key)
        self._inject_suspicious_ip_access(users_data, logs)
        
        anomaly_count = len(logs) - initial_count
        print(f"Injected {anomaly_count} anomalous events")
        
        # Step 4: Sort logs by timestamp
        print("Sorting logs by timestamp...")
        logs.sort(key=lambda x: x['timestamp'])
        
        print(f"✅ Total events generated: {len(logs)}")
        
        return logs, users_data
    
    def save_to_csv(self, logs, filename):
        """Save logs to CSV file"""
        print(f"\n💾 Saving logs to {filename}...")
        
        # Convert to DataFrame
        df = pd.DataFrame(logs)
        
        # Format timestamp
        df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # Reorder columns as specified
        column_order = ['timestamp', 'tenant_id', 'user_id', 'event_type', 'resource_id', 'status', 'ip_address']
        df = df[column_order]
        
        # Save to CSV
        df.to_csv(filename, index=False)
        
        print(f"✅ Successfully saved {len(df)} events to {filename}")
        
        # Print summary statistics
        print(f"\n📊 {filename} Summary:")
        print("-" * 40)
        print(f"Total Events: {len(df):,}")
        print(f"Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"Users: {df['user_id'].nunique()}")
        print(f"Unique IPs: {df['ip_address'].nunique()}")
        print(f"Success Rate: {(df['status'] == 'SUCCESS').mean():.1%}")
        
        print("\nEvent Type Distribution:")
        event_dist = df['event_type'].value_counts()
        for event_type, count in event_dist.items():
            percentage = (count / len(df)) * 100
            print(f"  {event_type}: {count:,} ({percentage:.1f}%)")
        
        return df
    
    def generate_all_datasets(self):
        """Generate both tenant datasets"""
        print("🎯 VaultSphere Separate Tenant Dataset Generator")
        print("=" * 60)
        
        datasets = {}
        
        # Generate Food Company dataset
        food_logs, food_users = self.generate_tenant_dataset('food')
        food_df = self.save_to_csv(food_logs, self.tenant_configs['food']['filename'])
        datasets['food'] = {'logs': food_logs, 'users': food_users, 'df': food_df}
        
        # Generate IT Solutions dataset
        it_logs, it_users = self.generate_tenant_dataset('it')
        it_df = self.save_to_csv(it_logs, self.tenant_configs['it']['filename'])
        datasets['it'] = {'logs': it_logs, 'users': it_users, 'df': it_df}
        
        # Print overall summary
        print(f"\n🎉 GENERATION COMPLETE!")
        print("=" * 60)
        print(f"Food Company Dataset: {len(food_logs):,} events → {self.tenant_configs['food']['filename']}")
        print(f"IT Solutions Dataset: {len(it_logs):,} events → {self.tenant_configs['it']['filename']}")
        print(f"Total Events: {len(food_logs) + len(it_logs):,}")
        
        return datasets

def main():
    """Main execution function"""
    generator = SeparateTenantDatasetGenerator()
    datasets = generator.generate_all_datasets()
    
    print("\n✨ Ready for ML model training and anomaly detection research!")
    print("Files created:")
    print("  • vaultsphere_food.csv - Food Company dataset")
    print("  • vaultsphere_it.csv - IT Solutions dataset")

if __name__ == "__main__":
    main()