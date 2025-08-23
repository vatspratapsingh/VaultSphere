import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Activity, 
  Server, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Code,
  Briefcase,
  DollarSign,
  GitBranch,
  Database,
  Cloud,
  CheckSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import TasksDashboard from '../TasksDashboard';

const ITCompanyDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [itStats] = useState({
    totalProjects: 24,
    activeProjects: 18,
    totalClients: 15,
    pendingDeliverables: 8,
    revenue: 125000,
    systemUptime: 99.8
  });

  const [projectData] = useState([
    { id: 1, name: 'E-commerce Platform', client: 'Retail Corp', status: 'active', progress: 75, deadline: '2024-02-15', team: 6 },
    { id: 2, name: 'Mobile App Development', client: 'TechStart', status: 'active', progress: 45, deadline: '2024-03-20', team: 4 },
    { id: 3, name: 'Cloud Migration', client: 'Enterprise Inc', status: 'completed', progress: 100, deadline: '2024-01-30', team: 8 },
    { id: 4, name: 'Data Analytics Dashboard', client: 'Finance Corp', status: 'active', progress: 60, deadline: '2024-04-10', team: 5 },
    { id: 5, name: 'API Integration', client: 'StartupXYZ', status: 'on-hold', progress: 30, deadline: '2024-05-15', team: 3 }
  ]);

  const [clientList] = useState([
    { id: 1, name: 'Retail Corp', industry: 'E-commerce', projects: 3, status: 'active', lastContact: '2 days ago' },
    { id: 2, name: 'TechStart', industry: 'SaaS', projects: 2, status: 'active', lastContact: '1 week ago' },
    { id: 3, name: 'Enterprise Inc', industry: 'Manufacturing', projects: 1, status: 'completed', lastContact: '2 weeks ago' },
    { id: 4, name: 'Finance Corp', industry: 'Financial Services', projects: 2, status: 'active', lastContact: '3 days ago' }
  ]);

  const [systemMetrics] = useState([
    { service: 'Web Servers', uptime: 99.9, responseTime: 120, status: 'healthy' },
    { service: 'Database Cluster', uptime: 99.8, responseTime: 45, status: 'healthy' },
    { service: 'API Gateway', uptime: 99.7, responseTime: 85, status: 'warning' },
    { service: 'CDN', uptime: 99.9, responseTime: 25, status: 'healthy' }
  ]);

  const chartData = [
    { name: 'Mon', projects: 18, revenue: 8500, tickets: 12 },
    { name: 'Tue', projects: 20, revenue: 9200, tickets: 15 },
    { name: 'Wed', projects: 22, revenue: 10500, tickets: 18 },
    { name: 'Thu', projects: 24, revenue: 11800, tickets: 22 },
    { name: 'Fri', projects: 21, revenue: 9800, tickets: 16 },
    { name: 'Sat', projects: 16, revenue: 7200, tickets: 8 },
    { name: 'Sun', projects: 12, revenue: 5400, tickets: 5 }
  ];

  const projectStatusData = [
    { name: 'Active', value: 18, color: '#10B981' },
    { name: 'Completed', value: 4, color: '#3B82F6' },
    { name: 'On Hold', value: 2, color: '#F59E0B' }
  ];

  const handleLogout = () => {
    logout();
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'on-hold': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen">
             {/* Header */}
       <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                                 <h1 className="text-2xl font-bold text-white">Tech Solutions Pro</h1>
                 <p className="text-sm text-gray-300">IT Solutions Dashboard</p>
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
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'monitoring', label: 'System Monitoring', icon: Activity },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                                 className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                   activeTab === tab.id
                     ? 'border-purple-400 text-purple-300'
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
                     <Briefcase className="h-6 w-6 text-blue-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Active Projects</p>
                     <p className="text-2xl font-semibold text-white">{itStats.activeProjects}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-green-900 rounded-lg">
                     <Users className="h-6 w-6 text-green-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Total Clients</p>
                     <p className="text-2xl font-semibold text-white">{itStats.totalClients}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-purple-900 rounded-lg">
                     <DollarSign className="h-6 w-6 text-purple-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Monthly Revenue</p>
                     <p className="text-2xl font-semibold text-white">${itStats.revenue.toLocaleString()}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-orange-900 rounded-lg">
                     <Server className="h-6 w-6 text-orange-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">System Uptime</p>
                     <p className="text-2xl font-semibold text-white">{itStats.systemUptime}%</p>
                   </div>
                 </div>
               </div>
             </div>

                         {/* Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <h3 className="text-lg font-medium text-white mb-4">Projects & Revenue Trend</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis yAxisId="left" />
                     <YAxis yAxisId="right" orientation="right" />
                     <Tooltip />
                     <Line yAxisId="left" type="monotone" dataKey="projects" stroke="#3B82F6" strokeWidth={2} />
                     <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <h3 className="text-lg font-medium text-white mb-4">Project Status Distribution</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={projectStatusData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {projectStatusData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>

                         {/* Recent Projects */}
             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
               <div className="px-6 py-4 border-b border-gray-700">
                 <h3 className="text-lg font-medium text-white">Recent Projects</h3>
               </div>
               <div className="divide-y divide-gray-700">
                 {projectData.slice(0, 4).map((project) => (
                   <div key={project.id} className="px-6 py-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <div className="p-2 bg-purple-900 rounded-lg">
                           <Code className="h-4 w-4 text-purple-300" />
                         </div>
                         <div>
                           <p className="text-sm font-medium text-white">{project.name}</p>
                           <p className="text-sm text-gray-400">{project.client} • Team: {project.team}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center space-x-3">
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusColor(project.status)}`}>
                             {project.status}
                           </span>
                           <span className="text-sm text-gray-400">{project.deadline}</span>
                         </div>
                         <div className="mt-2 flex items-center space-x-2">
                           <div className="w-24 bg-gray-600 rounded-full h-2">
                             <div 
                               className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                               style={{ width: `${project.progress}%` }}
                             ></div>
                           </div>
                           <span className="text-sm text-gray-300">{project.progress}%</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

                 {activeTab === 'projects' && (
           <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
             <div className="px-6 py-4 border-b border-gray-700">
               <h3 className="text-lg font-medium text-white">Project Management</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-700">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Size</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-800 divide-y divide-gray-700">
                   {projectData.map((project) => (
                     <tr key={project.id}>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-white">{project.name}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-white">{project.client}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusColor(project.status)}`}>
                           {project.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center space-x-2">
                           <div className="w-20 bg-gray-600 rounded-full h-2">
                             <div 
                               className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                               style={{ width: `${project.progress}%` }}
                             ></div>
                           </div>
                           <span className="text-sm text-gray-300">{project.progress}%</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{project.team}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{project.deadline}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button className="text-blue-400 hover:text-blue-300 mr-3">View</button>
                         <button className="text-green-400 hover:text-green-300">Edit</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

                 {activeTab === 'clients' && (
           <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
             <div className="px-6 py-4 border-b border-gray-700">
               <h3 className="text-lg font-medium text-white">Client Management</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-700">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-800 divide-y divide-gray-700">
                   {clientList.map((client) => (
                     <tr key={client.id}>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-white">{client.name}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-white">{client.industry}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{client.projects}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           client.status === 'active' ? 'text-green-300 bg-green-800' : 'text-blue-300 bg-blue-800'
                         }`}>
                           {client.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{client.lastContact}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button className="text-blue-400 hover:text-blue-300 mr-3">View</button>
                         <button className="text-green-400 hover:text-green-300">Contact</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {activeTab === 'monitoring' && (
           <div className="space-y-6">
             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
               <h3 className="text-lg font-medium text-white mb-4">System Health Monitoring</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {systemMetrics.map((metric, index) => (
                   <div key={index} className={`p-4 rounded-lg border ${
                     metric.status === 'warning' 
                       ? 'bg-yellow-900 border-yellow-700' 
                       : 'bg-green-900 border-green-700'
                   }`}>
                     <div className="flex items-center justify-between">
                       <div>
                         <h4 className="font-medium text-white">{metric.service}</h4>
                         <p className="text-sm text-gray-300">Response Time: {metric.responseTime}ms</p>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center space-x-2">
                           <Server className="h-5 w-5 text-gray-400" />
                           <span className={`text-lg font-semibold ${
                             metric.status === 'warning' ? 'text-yellow-300' : 'text-green-300'
                           }`}>
                             {metric.uptime}%
                           </span>
                         </div>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           metric.status === 'warning' ? 'text-yellow-200 bg-yellow-800' : 'text-green-200 bg-green-800'
                         }`}>
                           {metric.status}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
               <h3 className="text-lg font-medium text-white mb-4">Infrastructure Overview</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
                   <div className="flex items-center space-x-2 mb-2">
                     <Database className="h-5 w-5 text-blue-300" />
                     <h4 className="font-medium text-blue-200">Database</h4>
                   </div>
                   <p className="text-sm text-blue-300">3 Clusters • 99.8% Uptime</p>
                 </div>
                 <div className="p-4 bg-green-900 rounded-lg border border-green-700">
                   <div className="flex items-center space-x-2 mb-2">
                     <Cloud className="h-5 w-5 text-green-300" />
                     <h4 className="font-medium text-green-200">Cloud Services</h4>
                   </div>
                   <p className="text-sm text-green-300">AWS • Azure • GCP</p>
                 </div>
                 <div className="p-4 bg-purple-900 rounded-lg border border-purple-700">
                   <div className="flex items-center space-x-2 mb-2">
                     <GitBranch className="h-5 w-5 text-purple-300" />
                     <h4 className="font-medium text-purple-200">Version Control</h4>
                   </div>
                   <p className="text-sm text-purple-300">Git • CI/CD • DevOps</p>
                 </div>
               </div>
             </div>
           </div>
         )}

         {activeTab === 'tasks' && (
           <TasksDashboard />
         )}

         {activeTab === 'analytics' && (
           <div className="space-y-6">
             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
               <h3 className="text-lg font-medium text-white mb-4">Business Performance Analytics</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="revenue" fill="#8B5CF6" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
         )}
      </main>
    </div>
  );
};

export default ITCompanyDashboard;
