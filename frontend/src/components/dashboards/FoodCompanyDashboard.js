import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Activity, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Package,
  Truck,
  ShoppingCart,
  DollarSign,
  Thermometer,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import TasksDashboard from '../TasksDashboard';

const FoodCompanyDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [foodStats] = useState({
    totalProducts: 156,
    lowStockItems: 8,
    totalOrders: 89,
    pendingDeliveries: 12,
    revenue: 45600,
    temperatureAlerts: 2
  });

  const [inventoryData] = useState([
    { id: 1, name: 'Organic Tomatoes', category: 'Vegetables', stock: 45, unit: 'kg', lowStock: 20, status: 'good' },
    { id: 2, name: 'Fresh Milk', category: 'Dairy', stock: 15, unit: 'L', lowStock: 25, status: 'low' },
    { id: 3, name: 'Whole Grain Bread', category: 'Bakery', stock: 32, unit: 'units', lowStock: 15, status: 'good' },
    { id: 4, name: 'Free Range Eggs', category: 'Dairy', stock: 8, unit: 'dozen', lowStock: 20, status: 'critical' },
    { id: 5, name: 'Organic Apples', category: 'Fruits', stock: 28, unit: 'kg', lowStock: 30, status: 'good' }
  ]);

  const [recentOrders] = useState([
    { id: 1, customer: 'Restaurant ABC', items: 15, total: 450, status: 'delivered', time: '2 hours ago' },
    { id: 2, customer: 'Cafe XYZ', items: 8, total: 280, status: 'in-transit', time: '4 hours ago' },
    { id: 3, customer: 'Hotel Grand', items: 25, total: 890, status: 'processing', time: '6 hours ago' },
    { id: 4, customer: 'School Canteen', items: 12, total: 320, status: 'delivered', time: '1 day ago' }
  ]);

  const [temperatureData] = useState([
    { location: 'Cold Storage 1', temp: 2.5, status: 'normal', lastUpdate: '5 min ago' },
    { location: 'Cold Storage 2', temp: 3.2, status: 'normal', lastUpdate: '5 min ago' },
    { location: 'Freezer A', temp: -18.5, status: 'normal', lastUpdate: '5 min ago' },
    { location: 'Warehouse', temp: 22.1, status: 'alert', lastUpdate: '5 min ago' }
  ]);

  const chartData = [
    { name: 'Mon', orders: 12, revenue: 2400, temperature: 3.2 },
    { name: 'Tue', orders: 15, revenue: 3200, temperature: 2.8 },
    { name: 'Wed', orders: 18, revenue: 3800, temperature: 3.5 },
    { name: 'Thu', orders: 22, revenue: 4500, temperature: 2.9 },
    { name: 'Fri', orders: 19, revenue: 4100, temperature: 3.1 },
    { name: 'Sat', orders: 14, revenue: 2900, temperature: 3.3 },
    { name: 'Sun', orders: 8, revenue: 1800, temperature: 3.0 }
  ];

  const categoryData = [
    { name: 'Vegetables', value: 35, color: '#10B981' },
    { name: 'Dairy', value: 25, color: '#3B82F6' },
    { name: 'Fruits', value: 20, color: '#F59E0B' },
    { name: 'Bakery', value: 15, color: '#EF4444' },
    { name: 'Meat', value: 5, color: '#8B5CF6' }
  ];

  const handleLogout = () => {
    logout();
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'in-transit': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTemperatureStatus = (temp, location) => {
    if (location.includes('Cold Storage') && (temp > 5 || temp < 0)) return 'alert';
    if (location.includes('Freezer') && temp > -15) return 'alert';
    if (location.includes('Warehouse') && temp > 25) return 'alert';
    return 'normal';
  };

  return (
    <div className="min-h-screen">
             {/* Header */}
       <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                                 <h1 className="text-2xl font-bold text-white">Fresh Foods Inc.</h1>
                 <p className="text-sm text-gray-300">Food Company Dashboard</p>
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
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                                 className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                   activeTab === tab.id
                     ? 'border-green-400 text-green-300'
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
                     <Package className="h-6 w-6 text-blue-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Total Products</p>
                     <p className="text-2xl font-semibold text-white">{foodStats.totalProducts}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-green-900 rounded-lg">
                     <ShoppingCart className="h-6 w-6 text-green-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Total Orders</p>
                     <p className="text-2xl font-semibold text-white">{foodStats.totalOrders}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-purple-900 rounded-lg">
                     <DollarSign className="h-6 w-6 text-purple-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Revenue</p>
                     <p className="text-2xl font-semibold text-white">${foodStats.revenue.toLocaleString()}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <div className="flex items-center">
                   <div className="p-2 bg-orange-900 rounded-lg">
                     <Truck className="h-6 w-6 text-orange-300" />
                   </div>
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-300">Pending Deliveries</p>
                     <p className="text-2xl font-semibold text-white">{foodStats.pendingDeliveries}</p>
                   </div>
                 </div>
               </div>
             </div>

                         {/* Alerts */}
             {foodStats.temperatureAlerts > 0 && (
               <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                 <div className="flex items-center">
                   <AlertCircle className="h-5 w-5 text-red-300 mr-2" />
                   <span className="text-sm font-medium text-red-200">
                     {foodStats.temperatureAlerts} temperature alert(s) detected. Please check monitoring section.
                   </span>
                 </div>
               </div>
             )}

                         {/* Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <h3 className="text-lg font-medium text-white mb-4">Orders & Revenue Trend</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis yAxisId="left" />
                     <YAxis yAxisId="right" orientation="right" />
                     <Tooltip />
                     <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                     <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>

               <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                 <h3 className="text-lg font-medium text-white mb-4">Product Categories</h3>
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={categoryData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="value"
                     >
                       {categoryData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>

                         {/* Recent Orders */}
             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
               <div className="px-6 py-4 border-b border-gray-700">
                 <h3 className="text-lg font-medium text-white">Recent Orders</h3>
               </div>
               <div className="divide-y divide-gray-700">
                 {recentOrders.map((order) => (
                   <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                       <div className="p-2 bg-blue-900 rounded-lg">
                         <ShoppingCart className="h-4 w-4 text-blue-300" />
                       </div>
                       <div>
                         <p className="text-sm font-medium text-white">{order.customer}</p>
                         <p className="text-sm text-gray-400">{order.items} items</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-medium text-white">${order.total}</p>
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                         {order.status}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

                 {activeTab === 'inventory' && (
           <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
             <div className="px-6 py-4 border-b border-gray-700">
               <h3 className="text-lg font-medium text-white">Inventory Management</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-700">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Alert</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-800 divide-y divide-gray-700">
                   {inventoryData.map((item) => (
                     <tr key={item.id}>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-white">{item.name}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-white">{item.category}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-white">{item.stock} {item.unit}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-white">{item.lowStock} {item.unit}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                           {item.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button className="text-blue-400 hover:text-blue-300 mr-3">Restock</button>
                         <button className="text-green-400 hover:text-green-300">Edit</button>
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
               <h3 className="text-lg font-medium text-white mb-4">Temperature Monitoring</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {temperatureData.map((location, index) => (
                   <div key={index} className={`p-4 rounded-lg border ${
                     getTemperatureStatus(location.temp, location.location) === 'alert' 
                       ? 'bg-red-900 border-red-700' 
                       : 'bg-green-900 border-green-700'
                   }`}>
                     <div className="flex items-center justify-between">
                       <div>
                         <h4 className="font-medium text-white">{location.location}</h4>
                         <p className="text-sm text-gray-300">Last update: {location.lastUpdate}</p>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center space-x-2">
                           <Thermometer className="h-5 w-5 text-gray-400" />
                           <span className={`text-lg font-semibold ${
                             getTemperatureStatus(location.temp, location.location) === 'alert' 
                               ? 'text-red-300' 
                               : 'text-green-300'
                           }`}>
                             {location.temp}°C
                           </span>
                         </div>
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           getTemperatureStatus(location.temp, location.location) === 'alert'
                             ? 'text-red-200 bg-red-800'
                             : 'text-green-200 bg-green-800'
                         }`}>
                           {getTemperatureStatus(location.temp, location.location) === 'alert' ? 'Alert' : 'Normal'}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

                 {activeTab === 'orders' && (
           <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
             <div className="px-6 py-4 border-b border-gray-700">
               <h3 className="text-lg font-medium text-white">Order Management</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-700">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-gray-800 divide-y divide-gray-700">
                   {recentOrders.map((order) => (
                     <tr key={order.id}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">#{order.id}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.customer}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.items}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${order.total}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                           {order.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{order.time}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <button className="text-blue-400 hover:text-blue-300 mr-3">View</button>
                         <button className="text-green-400 hover:text-green-300">Update</button>
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

         {activeTab === 'analytics' && (
           <div className="space-y-6">
             <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
               <h3 className="text-lg font-medium text-white mb-4">Business Analytics</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="revenue" fill="#10B981" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
         )}
      </main>
    </div>
  );
};

export default FoodCompanyDashboard;
