import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Leaf, DollarSign, Activity, Loader } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL.replace('/api', '');

const ChartCard = ({ chart }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-all shadow-lg">
    <div className="flex items-center space-x-2 mb-4">
      <h3 className="text-lg font-semibold text-white">{chart.title}</h3>
    </div>
    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
      <img 
        src={`${API_BASE_URL}${chart.url}`} 
        alt={chart.title} 
        className="w-full h-full object-contain p-2 opacity-90 hover:opacity-100 transition-opacity"
        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x225?text=Chart+Preview'; }}
      />
    </div>
    <p className="mt-3 text-sm text-gray-400">{chart.description}</p>
  </div>
);

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('1'); 
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/${activeTab}`);
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [activeTab]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Cloud Intelligence Dashboard</h1>
        <p className="text-gray-400 mt-2">Resource efficiency, sustainability, and cost optimization insights.</p>
      </header>

      <div className="flex space-x-4 mb-8 border-b border-gray-700">
        <button 
          onClick={() => setActiveTab('1')}
          className={`pb-4 px-4 font-medium transition-all ${activeTab === '1' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Food Tenant (Healthy Foods)
        </button>
        <button 
          onClick={() => setActiveTab('2')}
          className={`pb-4 px-4 font-medium transition-all ${activeTab === '2' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          IT Tenant (Tech Solutions)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Loader className="animate-spin mb-4" size={48} />
          <p>Analyzing tenant cloud footprint...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics?.charts.map(chart => (
            <ChartCard key={chart.id} chart={chart} />
          ))}
        </div>
      )}

      <footer className="mt-12 p-6 bg-green-900/20 border border-green-800 rounded-xl">
        <div className="flex items-start space-x-4">
          <Leaf className="text-green-500 mt-1" />
          <div>
            <h4 className="text-green-400 font-bold">Societal Impact Note</h4>
            <p className="text-sm text-green-200/70 mt-1">
              By optimizing idle resource usage across tenants, VaultSphere reduces unnecessary energy consumption. 
              The sustainability score helps tenants understand their role in building a greener cloud ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsDashboard;
