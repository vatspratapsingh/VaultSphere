import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Building, 
  Activity, 
  BarChart3, 
  LogOut,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Server,
  CheckSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import TasksDashboard from '../TasksDashboard';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats] = useState({
    totalTenants: 12,
    activeTenants: 11,
    systemHealth: 98,
    uptime: 99.9,
    totalUsers: 156,
    activeUsers: 142
  });

  const [recentActivity] = useState([
    { id: 1, action: 'New tenant registered', tenant: 'TechCorp Inc.', time: '2 minutes ago', status: 'success' },
    { id: 2, action: 'System backup completed', tenant: 'All', time: '1 hour ago', status: 'success' },
    { id: 3, action: 'Performance alert', tenant: 'FoodCorp', time: '3 hours ago', status: 'warning' },
    { id: 4, action: 'Security update deployed', tenant: 'All', time: '6 hours ago', status: 'success' }
  ]);

  const [tenantList] = useState([
    { id: 1, name: 'Fresh Foods Inc.', type: 'Food Company', status: 'active', users: 25, lastActive: '2 hours ago' },
    { id: 2, name: 'Tech Solutions Pro', type: 'IT Company', status: 'active', users: 18, lastActive: '1 hour ago' },
    { id: 3, name: 'Green Groceries', type: 'Food Company', status: 'active', users: 12, lastActive: '30 minutes ago' },
    { id: 4, name: 'Digital Dynamics', type: 'IT Company', status: 'inactive', users: 8, lastActive: '2 days ago' }
  ]);

  const chartData = [
    { name: 'Mon', users: 120, performance: 85 },
    { name: 'Tue', users: 135, performance: 88 },
    { name: 'Wed', users: 142, performance: 92 },
    { name: 'Thu', users: 156, performance: 90 },
    { name: 'Fri', users: 148, performance: 87 },
    { name: 'Sat', users: 98, performance: 82 },
    { name: 'Sun', users: 85, performance: 80 }
  ];

  const pieData = [
    { name: 'Food Companies', value: 6, color: '#10B981' },
    { name: 'IT Companies', value: 4, color: '#3B82F6' },
    { name: 'Other', value: 2, color: '#F59E0B' }
  ];

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">VaultSphere Admin</h1>
                <p className="text-sm text-gray-300">System Administration Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tenants', label: 'Tenants', icon: Building },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'security', label: 'Security', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-900 rounded-lg">
                    <Users className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Total Tenants</p>
                    <p className="text-2xl font-semibold text-white">{systemStats.totalTenants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-900 rounded-lg">
                    <Activity className="h-6 w-6 text-green-300" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">System Health</p>
                    <p className="text-2xl font-semibold text-white">{systemStats.systemHealth}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-900 rounded-lg">
                    <Server className="h-6 w-6 text-purple-300" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Uptime</p>
                    <p className="text-2xl font-semibold text-white">{systemStats.uptime}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-900 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-300" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Active Users</p>
                    <p className="text-2xl font-semibold text-white">{systemStats.activeUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-medium text-white mb-4">User Activity Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Tenant Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-700">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(activity.status)}
                                             <div>
                         <p className="text-sm font-medium text-white">{activity.action}</p>
                         <p className="text-sm text-gray-400">{activity.tenant}</p>
                       </div>
                     </div>
                     <span className="text-sm text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Tenant Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {tenantList.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{tenant.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{tenant.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{tenant.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{tenant.lastActive}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
                        <button className="text-red-400 hover:text-red-300">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TasksDashboard />
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h3 className="text-lg font-medium text-white mb-4">System Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="performance" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Security Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-900 rounded-lg border border-green-700">
                <h4 className="font-medium text-green-300">Security Status: Secure</h4>
                <p className="text-sm text-green-200 mt-1">All security measures are up to date</p>
              </div>
              <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
                <h4 className="font-medium text-blue-300">Last Security Scan: 2 hours ago</h4>
                <p className="text-sm text-blue-200 mt-1">No vulnerabilities detected</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
