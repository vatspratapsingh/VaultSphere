#!/usr/bin/env python3
"""
VaultSphere Synthetic User Activity Log Generator
Generates realistic user activity logs with anomalies for anomaly detection research.

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

class VaultSphereLogGenerator:
    def __init__(self):
        self.days_back = 30
        
        # Define tenant-specific configurations
        self.tenant_configs = {
            1: {
                'name': 'Food Company',
                'email': 'food@vaultsphere.com',
                'password': 'food123',
                'dashboard': 'Food Company Dashboard (Client User)',
                'users': 40,
                'events_per_user': 150,
                'event_types': {
                    'LOGIN': 0.30,
                    'ORDER': 0.25,
                    'PAYMENT': 0.20,
                    'UPDATE': 0.15,
                    'COMPLAINT': 0.10
                }
            },
            2: {
                'name': 'IT Solutions Company',
                'email': 'it@vaultsphere.com',
                'password': 'it123',
                'dashboard': 'IT Solutions Dashboard (Client User)',
                'users': 50,
                'events_per_user': 200,
                'event_types': {
                    'LOGIN': 0.25,
                    'UPLOAD': 0.25,
                    'DOWNLOAD': 0.25,
                    'UPDATE': 0.15,
                    'ADMIN_ACTION': 0.10
                }
            }
        }
        
        # User roles and their typical behaviors (simplified for business context)
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
        
        # Initialize data structures
        self.users_data = {}
        self.logs = []
        
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
    
    def _create_users(self):
        """Create users for all tenants with assigned roles and typical IPs"""
        print("Creating users and assigning roles...")
        
        total_users = 0
        for tenant_id, config in self.tenant_configs.items():
            tenant_users = {}
            num_users = config['users']
            
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
                
                tenant_users[global_user_id] = {
                    'role': role,
                    'typical_ips': typical_ips,
                    'tenant_id': tenant_id,
                    'local_user_id': user_id,
                    'tenant_name': config['name']
                }
            
            self.users_data[tenant_id] = tenant_users
            total_users += num_users
        
        print(f"Created {total_users} users across {len(self.tenant_configs)} tenants")
    
    def _generate_normal_events(self, user_id, user_info, num_events):
        """Generate normal user activity events"""
        events = []
        tenant_id = user_info['tenant_id']
        typical_ips = user_info['typical_ips']
        
        # Get tenant-specific event distribution
        tenant_config = self.tenant_configs[tenant_id]
        tenant_events = tenant_config['event_types']
        
        for _ in range(num_events):
            # Generate timestamp within the last 30 days
            days_ago = random.uniform(0, self.days_back)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            # Add some realistic time patterns (more activity during business hours)
            if random.random() < 0.7:  # 70% during business hours
                business_hour = random.randint(9, 17)
                timestamp = timestamp.replace(hour=business_hour, minute=random.randint(0, 59))
            
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
                'tenant_id': tenant_id,
                'user_id': user_id,
                'event_type': event_type,
                'resource_id': resource_id,
                'status': status,
                'ip_address': ip_address
            })
        
        return events
    
    def _inject_failed_login_bursts(self):
        """Inject bursts of failed login attempts (brute force simulation)"""
        print("Injecting failed login burst anomalies...")
        
        # Select users from both tenants for failed login bursts
        all_users = [(user_id, user_info) for tenant_users in self.users_data.values() 
                     for user_id, user_info in tenant_users.items()]
        
        # Select 5% of users for failed login bursts
        num_anomaly_users = max(2, int(len(all_users) * 0.05))
        anomaly_users = random.sample(all_users, num_anomaly_users)
        
        for user_id, user_info in anomaly_users:
            # Generate burst of failed logins
            burst_start = datetime.now() - timedelta(days=random.uniform(1, 25))
            burst_duration = timedelta(minutes=random.randint(10, 120))  # 10 minutes to 2 hours
            
            # 10-30 failed login attempts
            num_attempts = random.randint(10, 30)
            
            for i in range(num_attempts):
                timestamp = burst_start + timedelta(
                    seconds=random.uniform(0, burst_duration.total_seconds())
                )
                
                # Mix of suspicious and normal IPs during attack
                if random.random() < 0.6:  # 60% from suspicious IPs
                    ip_address = random.choice(self.suspicious_ips)
                else:
                    ip_address = random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                
                self.logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': 'LOGIN',
                    'resource_id': f"RES_{random.randint(1, 1000)}",
                    'status': 'FAILURE',
                    'ip_address': ip_address
                })
    
    def _inject_unusual_event_types(self):
        """Inject unusual event types for users based on tenant context"""
        print("Injecting unusual event type anomalies...")
        
        # For IT Solutions Company - inject unusual admin actions by non-admin users
        if 2 in self.users_data:
            it_users = [(user_id, user_info) for user_id, user_info in self.users_data[2].items() 
                       if user_info['role'] != 'admin']
            
            if it_users:
                # Select 5% of non-admin IT users for unusual admin actions
                num_anomaly_users = max(1, int(len(it_users) * 0.05))
                anomaly_users = random.sample(it_users, num_anomaly_users)
                
                for user_id, user_info in anomaly_users:
                    # Generate 2-4 unusual admin actions
                    num_actions = random.randint(2, 4)
                    
                    for _ in range(num_actions):
                        timestamp = datetime.now() - timedelta(days=random.uniform(1, 28))
                        
                        # Add some time jitter
                        timestamp += timedelta(
                            hours=random.randint(0, 23),
                            minutes=random.randint(0, 59)
                        )
                        
                        self.logs.append({
                            'timestamp': timestamp,
                            'tenant_id': user_info['tenant_id'],
                            'user_id': user_id,
                            'event_type': 'ADMIN_ACTION',
                            'resource_id': f"RES_{random.randint(1, 1000)}",
                            'status': 'SUCCESS',
                            'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                        })
        
        # For Food Company - inject unusual complaint patterns
        if 1 in self.users_data:
            food_users = [(user_id, user_info) for user_id, user_info in self.users_data[1].items()]
            
            if food_users:
                # Select some users for excessive complaints
                num_anomaly_users = max(1, int(len(food_users) * 0.03))
                anomaly_users = random.sample(food_users, num_anomaly_users)
                
                for user_id, user_info in anomaly_users:
                    # Generate excessive complaints
                    num_complaints = random.randint(8, 15)
                    
                    for _ in range(num_complaints):
                        timestamp = datetime.now() - timedelta(days=random.uniform(1, 28))
                        
                        self.logs.append({
                            'timestamp': timestamp,
                            'tenant_id': user_info['tenant_id'],
                            'user_id': user_id,
                            'event_type': 'COMPLAINT',
                            'resource_id': f"RES_{random.randint(1, 1000)}",
                            'status': 'SUCCESS',
                            'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                        })
    
    def _inject_unusual_ip_access(self):
        """Inject access from unusual IP addresses"""
        print("Injecting unusual IP address anomalies...")
        
        # Select 25 users for unusual IP access
        all_users = [(user_id, user_info) for tenant_users in self.users_data.values() 
                     for user_id, user_info in tenant_users.items()]
        anomaly_users = random.sample(all_users, 25)
        
        for user_id, user_info in anomaly_users:
            # Generate 3-8 events from suspicious IPs
            num_events = random.randint(3, 8)
            
            for _ in range(num_events):
                timestamp = datetime.now() - timedelta(days=random.uniform(1, 25))
                
                # Random event type
                event_type = random.choice(['LOGIN', 'CREATE', 'UPDATE', 'DOWNLOAD'])
                
                # Suspicious IP
                suspicious_ip = random.choice(self.suspicious_ips)
                
                # Higher chance of failure from suspicious IPs
                status = 'SUCCESS' if random.random() < 0.7 else 'FAILURE'
                
                self.logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': event_type,
                    'resource_id': f"RES_{user_info['tenant_id']}_{random.randint(1000, 9999)}",
                    'status': status,
                    'ip_address': suspicious_ip
                })
    
    def _inject_off_hours_activity(self):
        """Inject suspicious off-hours activity"""
        print("Injecting off-hours activity anomalies...")
        
        all_users = [(user_id, user_info) for tenant_users in self.users_data.values() 
                     for user_id, user_info in tenant_users.items()]
        
        # Select 5% of users for off-hours activity
        num_anomaly_users = max(2, int(len(all_users) * 0.05))
        anomaly_users = random.sample(all_users, num_anomaly_users)
        
        for user_id, user_info in anomaly_users:
            # Generate 5-12 events during off hours (11 PM - 5 AM)
            num_events = random.randint(5, 12)
            tenant_id = user_info['tenant_id']
            tenant_config = self.tenant_configs[tenant_id]
            
            for _ in range(num_events):
                timestamp = datetime.now() - timedelta(days=random.uniform(1, 20))
                
                # Set to off hours
                off_hour = random.choice([23, 0, 1, 2, 3, 4, 5])
                timestamp = timestamp.replace(hour=off_hour, minute=random.randint(0, 59))
                
                # Choose appropriate event type based on tenant
                if tenant_id == 1:  # Food Company
                    event_type = random.choice(['ORDER', 'PAYMENT', 'UPDATE'])
                else:  # IT Solutions Company
                    event_type = random.choice(['UPLOAD', 'DOWNLOAD', 'UPDATE', 'ADMIN_ACTION'])
                
                self.logs.append({
                    'timestamp': timestamp,
                    'tenant_id': user_info['tenant_id'],
                    'user_id': user_id,
                    'event_type': event_type,
                    'resource_id': f"RES_{random.randint(1, 1000)}",
                    'status': 'SUCCESS',
                    'ip_address': random.choice(user_info['typical_ips']) if user_info['typical_ips'] else random.choice(self.corporate_ips)
                })
    
    def generate_logs(self):
        """Main method to generate all logs"""
        print("🚀 Starting VaultSphere Synthetic Log Generation")
        print("=" * 60)
        
        # Step 1: Create users
        self._create_users()
        
        # Step 2: Generate normal events for all users
        print("Generating normal user activity events...")
        total_users = 0
        for tenant_id, tenant_users in self.users_data.items():
            tenant_config = self.tenant_configs[tenant_id]
            events_per_user = tenant_config['events_per_user']
            
            print(f"Generating events for {tenant_config['name']} users...")
            for user_id, user_info in tenant_users.items():
                normal_events = self._generate_normal_events(user_id, user_info, events_per_user)
                self.logs.extend(normal_events)
                total_users += 1
        
        print(f"Generated {len(self.logs)} normal events for {total_users} users")
        
        # Step 3: Inject anomalies
        print("\n🔍 Injecting realistic anomalies...")
        initial_count = len(self.logs)
        
        self._inject_failed_login_bursts()
        self._inject_unusual_event_types()
        self._inject_unusual_ip_access()
        self._inject_off_hours_activity()
        
        anomaly_count = len(self.logs) - initial_count
        print(f"Injected {anomaly_count} anomalous events")
        
        # Step 4: Sort logs by timestamp
        print("\nSorting logs by timestamp...")
        self.logs.sort(key=lambda x: x['timestamp'])
        
        print(f"\n✅ Total events generated: {len(self.logs)}")
        return self.logs
    
    def save_to_csv(self, filename='synthetic_vaultsphere_logs.csv'):
        """Save logs to CSV file"""
        print(f"\n💾 Saving logs to {filename}...")
        
        # Convert to DataFrame
        df = pd.DataFrame(self.logs)
        
        # Format timestamp
        df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # Reorder columns
        column_order = ['timestamp', 'tenant_id', 'user_id', 'event_type', 'resource_id', 'status', 'ip_address']
        df = df[column_order]
        
        # Save to CSV
        df.to_csv(filename, index=False)
        
        print(f"✅ Successfully saved {len(df)} events to {filename}")
        
        # Print summary statistics
        print("\n📊 Dataset Summary:")
        print("-" * 40)
        print(f"Total Events: {len(df):,}")
        print(f"Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"Tenants: {df['tenant_id'].nunique()}")
        print(f"Users: {df['user_id'].nunique()}")
        print(f"Unique IPs: {df['ip_address'].nunique()}")
        
        print("\nTenant Breakdown:")
        for tenant_id in sorted(df['tenant_id'].unique()):
            tenant_data = df[df['tenant_id'] == tenant_id]
            tenant_name = self.tenant_configs[tenant_id]['name']
            print(f"  Tenant {tenant_id} ({tenant_name}): {len(tenant_data):,} events, {tenant_data['user_id'].nunique()} users")
        
        print("\nEvent Type Distribution:")
        event_counts = df['event_type'].value_counts()
        for event_type, count in event_counts.items():
            percentage = (count / len(df)) * 100
            print(f"  {event_type}: {count:,} ({percentage:.1f}%)")
        
        print("\nStatus Distribution:")
        status_counts = df['status'].value_counts()
        for status, count in status_counts.items():
            percentage = (count / len(df)) * 100
            print(f"  {status}: {count:,} ({percentage:.1f}%)")
        
        return df

def main():
    """Main execution function"""
    print("🏢 VaultSphere Multi-Tenant Synthetic Log Generator")
    print("Generating realistic user activity logs with anomalies for ML research")
    print("=" * 80)
    
    # Create generator instance
    generator = VaultSphereLogGenerator()
    
    # Display tenant information
    print("\n🏢 Tenant Configuration:")
    for tenant_id, config in generator.tenant_configs.items():
        print(f"Tenant {tenant_id}: {config['name']}")
        print(f"  Login: {config['email']} / {config['password']}")
        print(f"  Dashboard: {config['dashboard']}")
        print(f"  Users: {config['users']}")
        print(f"  Events per user: {config['events_per_user']}")
        print(f"  Event types: {', '.join(config['event_types'].keys())}")
        print()
    
    # Generate logs
    logs = generator.generate_logs()
    
    # Save to CSV
    df = generator.save_to_csv('synthetic_vaultsphere_logs.csv')
    
    print("\n🎉 Log generation completed successfully!")
    print("\nNext steps:")
    print("1. Load the CSV file into your anomaly detection system")
    print("2. Look for patterns in failed login bursts, unusual event types, and suspicious IPs")
    print("3. Use timestamp patterns to detect off-hours activity")
    print("4. Analyze per-tenant and per-user behavior patterns")
    print("5. Focus on tenant-specific anomalies:")
    print("   - Food Company: Excessive complaints, payment failures")
    print("   - IT Solutions: Unauthorized admin actions, unusual uploads")
    
    return df

if __name__ == "__main__":
    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Run the generator
    df = main()