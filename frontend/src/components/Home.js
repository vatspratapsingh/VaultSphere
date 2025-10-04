import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  MessageCircle, 
  UserPlus, 
  Search,
  LogOut,
  Building,
  Send,
  MoreVertical
} from 'lucide-react';

const Home = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('meet');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  
  // Mock data for people to meet
  const [peopleToMeet] = useState([
    { id: 1, name: 'Alex Chen', email: 'alex@techsolutions.com', company: 'Tech Solutions Pro', interests: ['AI', 'Machine Learning'], mutualConnections: 3 },
    { id: 2, name: 'Lisa Wang', email: 'lisa@freshfoods.com', company: 'Fresh Foods Inc', interests: ['Sustainability', 'Food Tech'], mutualConnections: 2 },
    { id: 3, name: 'Tom Rodriguez', email: 'tom@techsolutions.com', company: 'Tech Solutions Pro', interests: ['Cloud Computing', 'DevOps'], mutualConnections: 5 },
    { id: 4, name: 'Maria Garcia', email: 'maria@freshfoods.com', company: 'Fresh Foods Inc', interests: ['Organic Farming', 'Supply Chain'], mutualConnections: 1 },
    { id: 5, name: 'James Wilson', email: 'james@techsolutions.com', company: 'Tech Solutions Pro', interests: ['Cybersecurity', 'Networking'], mutualConnections: 4 }
  ]);

  // Mock chat data
  const [chats] = useState([
    { id: 1, name: 'John Smith', lastMessage: 'Hey, how are you doing?', time: '2 min ago', unread: 2, online: true },
    { id: 2, name: 'Sarah Johnson', lastMessage: 'Thanks for the help!', time: '1 hour ago', unread: 0, online: false },
    { id: 3, name: 'Mike Wilson', lastMessage: 'Can we schedule a call?', time: '3 hours ago', unread: 1, online: true },
    { id: 4, name: 'Emily Davis', lastMessage: 'The project is ready', time: '1 day ago', unread: 0, online: false },
    { id: 5, name: 'David Brown', lastMessage: 'Great work on this!', time: '2 days ago', unread: 0, online: false }
  ]);

  const handleLogout = () => {
    logout();
  };

  const filteredPeople = peopleToMeet.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Here you would typically send the message to the backend
      console.log('Sending message:', messageText);
      setMessageText('');
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
                <h1 className="text-2xl font-bold text-white">Home</h1>
                <p className="text-sm text-gray-300">Meet new people and chat with friends</p>
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
                  tab.id === 'home'
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
          {/* Content Tabs */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="border-b border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'meet', label: 'Meet New People', icon: UserPlus },
                  { id: 'chats', label: 'Chats', icon: MessageCircle }
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
              </nav>
            </div>

            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={activeTab === 'meet' ? "Search people to meet..." : "Search chats..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Meet New People Tab */}
              {activeTab === 'meet' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">People You May Know</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPeople.map((person) => (
                      <div key={person.id} className="bg-gray-750 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {person.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{person.name}</h3>
                              <p className="text-sm text-gray-400">{person.company}</p>
                              <p className="text-xs text-gray-500">{person.mutualConnections} mutual connections</p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {person.interests.map((interest, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm transition-colors duration-200">
                            Connect
                          </button>
                          <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm transition-colors duration-200">
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chats Tab */}
              {activeTab === 'chats' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Recent Chats</h2>
                  <div className="space-y-2">
                    {filteredChats.map((chat) => (
                      <div key={chat.id} className="flex items-center space-x-4 p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
                        <div className="relative">
                          <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {chat.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          {chat.online && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">{chat.name}</h3>
                            <span className="text-xs text-gray-500">{chat.time}</span>
                          </div>
                          <p className="text-sm text-gray-400">{chat.lastMessage}</p>
                        </div>
                        {chat.unread > 0 && (
                          <div className="bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Message */}
          {activeTab === 'chats' && (
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h3 className="text-lg font-medium text-white mb-4">Quick Message</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
