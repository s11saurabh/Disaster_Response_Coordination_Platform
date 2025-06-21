import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  AlertTriangle, 
  Map, 
  Plus, 
  Search,
  Filter,
  Clock,
  MapPin,
  Activity,
  BarChart3,
  Settings,
  FileText,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const Sidebar = ({ onClose, selectedDisaster, onDisasterSelect }) => {
  const location = useLocation();
  const { disasters } = useApi();
  const [recentDisasters, setRecentDisasters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentDisasters = async () => {
      try {
        const response = await disasters.getAll({ limit: 10 });
        if (response.success) {
          setRecentDisasters(response.data);
        }
      } catch (error) {
        console.error('Failed to load recent disasters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentDisasters();
  }, [disasters]);

  const filteredDisasters = recentDisasters.filter(disaster => {
    const matchesSearch = disaster.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         disaster.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
                         disaster.tags?.includes(activeFilter) ||
                         (activeFilter === 'urgent' && disaster.tags?.includes('urgent'));
    
    return matchesSearch && matchesFilter;
  });

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 20, stiffness: 300 }
    },
    exit: { 
      x: -300, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: AlertTriangle, label: 'Disasters', path: '/disasters' },
    { icon: MessageCircle, label: 'Social Media', path: '/social-media' },
    { icon: Globe, label: 'Official Updates', path: '/browse' },
    { icon: Map, label: 'Resource Map', path: '/map' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const filterOptions = [
    { value: 'all', label: 'All Disasters', count: recentDisasters.length },
    { value: 'urgent', label: 'Urgent', count: recentDisasters.filter(d => d.tags?.includes('urgent')).length },
    { value: 'flood', label: 'Floods', count: recentDisasters.filter(d => d.tags?.includes('flood')).length },
    { value: 'fire', label: 'Fires', count: recentDisasters.filter(d => d.tags?.includes('fire')).length },
    { value: 'earthquake', label: 'Earthquakes', count: recentDisasters.filter(d => d.tags?.includes('earthquake')).length }
  ];

  const getPriorityColor = (tags) => {
    if (tags?.includes('urgent') || tags?.includes('critical')) return 'bg-red-500';
    if (tags?.includes('high')) return 'bg-orange-500';
    if (tags?.includes('medium')) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-xl z-40 overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Control Panel</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          to="/disasters/new"
          onClick={onClose}
          className="flex items-center justify-center space-x-2 w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Report Emergency</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Disasters</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredDisasters.length}
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search disasters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : filteredDisasters.length > 0 ? (
            <AnimatePresence>
              {filteredDisasters.map((disaster, index) => (
                <motion.div
                  key={disaster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onDisasterSelect(disaster);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedDisaster?.id === disaster.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {disaster.title}
                    </h4>
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(disaster.tags)} flex-shrink-0 ml-2`}></div>
                  </div>

                  {disaster.location_name && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{disaster.location_name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{getTimeAgo(disaster.created_at)}</span>
                    </div>

                    {disaster.tags && disaster.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {disaster.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                        {disaster.tags.length > 2 && (
                          <span className="text-gray-400">+{disaster.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery || activeFilter !== 'all' 
                  ? 'No disasters match your search'
                  : 'No recent disasters found'
                }
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{recentDisasters.length}</div>
              <div className="text-xs text-gray-500">Total Events</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {recentDisasters.filter(d => d.tags?.includes('urgent')).length}
              </div>
              <div className="text-xs text-gray-500">Urgent</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;