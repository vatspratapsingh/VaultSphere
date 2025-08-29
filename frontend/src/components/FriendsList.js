import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Search,
  LogOut,
  Building
} from 'lucide-react';

const FriendsList = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock friends data
  const [friends] = useState([
    { id: 1, name: 'John Smith', email: 'john@techsolutions.com', status: 'online', lastSeen: '2 minutes ago', company: 'Tech Solutions Pro' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@freshfoods.com', status: 'online', lastSeen: '5 minutes ago', company: 'Fresh Foods Inc' },
    { id: 3, name: 'Mike Wilson', email: 'mike@techsolutions.com', status: 'offline', lastSeen: '1 hour ago', company: 'Tech Solutions Pro' },
    { id: 4, name: 'Emily Davis', email: 'emily@freshfoods.com', status: 'online', lastSeen: '10 minutes ago', company: 'Fresh Foods Inc' },
    { id: 5, name: 'David Brown', email: 'david@techsolutions.com', status: 'away', lastSeen: '30 minutes ago', company: 'Tech Solutions Pro' }
  ]);

  const handleLogout = () => {
    logout();
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Friends</h1>
                <p className="text-sm text-gray-300">Connect with your network</p>
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
              { id: 'home', label: 'Home', icon: Building, href: user?.role === 'admin' ? '/admin' : user?.role === 'food' ? '/food-company' : '/it-company' },
              { id: 'friends', label: 'Friends', icon: Users, href: '/friends' }
            ].map((tab) => (
              <a
                key={tab.id}
                href={tab.href}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  tab.id === 'friends'
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200">
                <UserPlus className="h-4 w-4" />
                <span>Add Friend</span>
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Your Friends ({filteredFriends.length})</h2>
            </div>
            <div className="divide-y divide-gray-700">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="p-6 hover:bg-gray-750 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {friend.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 ${getStatusColor(friend.status)} rounded-full border-2 border-gray-800`}></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{friend.name}</h3>
                        <p className="text-sm text-gray-400">{friend.email}</p>
                        <p className="text-xs text-gray-500">{friend.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-300 capitalize">{friend.status}</p>
                        <p className="text-xs text-gray-500">{friend.lastSeen}</p>
                      </div>
                      <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200">
                        <MessageCircle className="h-4 w-4" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredFriends.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-300">No friends found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FriendsList;
