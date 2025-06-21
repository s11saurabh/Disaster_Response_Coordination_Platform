import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  RefreshCw, 
  Filter, 
  Search,
  ExternalLink,
  FileText,
  Building,
  Clock,
  Phone,
  Zap,
  Shield,
  Heart,
  Users
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const OfficialUpdates = ({ disasterId, onUpdateSelect }) => {
  const { officialUpdates } = useApi();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSources, setAvailableSources] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    if (disasterId) {
      loadOfficialUpdates();
      loadAvailableSources();
    }
  }, [disasterId]);

  const loadOfficialUpdates = async () => {
    setLoading(true);
    try {
      const response = await officialUpdates.getForDisaster(disasterId, {
        sources: filterSource,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
        keywords: searchQuery || undefined,
        limit: 50
      });
      
      if (response.success && response.data.updates) {
        setUpdates(response.data.updates);
        calculateStats(response.data.updates);
      } else {
        toast.error('Failed to load official updates');
      }
    } catch (error) {
      console.error('Error loading official updates:', error);
      toast.error('Error loading official updates');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSources = async () => {
    try {
      const response = await officialUpdates.getSources();
      if (response.success && response.data.available_sources) {
        setAvailableSources(response.data.available_sources);
      }
    } catch (error) {
      console.error('Error loading available sources:', error);
    }
  };

  const calculateStats = (updatesData) => {
    const statsData = {
      total: updatesData.length,
      high: updatesData.filter(u => u.severity === 'high').length,
      medium: updatesData.filter(u => u.severity === 'medium').length,
      low: updatesData.filter(u => u.severity === 'low').length
    };
    setStats(statsData);
  };

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = !searchQuery || 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSourceIcon = (source) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('fema')) return <Shield className="w-5 h-5 text-blue-600" />;
    if (sourceLower.includes('red cross')) return <Heart className="w-5 h-5 text-red-600" />;
    if (sourceLower.includes('weather')) return <Zap className="w-5 h-5 text-yellow-600" />;
    if (sourceLower.includes('nyc') || sourceLower.includes('emergency')) return <Building className="w-5 h-5 text-gray-600" />;
    return <Globe className="w-5 h-5 text-gray-600" />;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'shelter': return <Building className="w-4 h-4" />;
      case 'supplies': return <FileText className="w-4 h-4" />;
      case 'volunteer': return <Users className="w-4 h-4" />;
      case 'weather': return <Zap className="w-4 h-4" />;
      case 'food': return <Heart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const severityOptions = [
    { value: 'all', label: 'All Severity', count: stats.total },
    { value: 'high', label: 'High', count: stats.high },
    { value: 'medium', label: 'Medium', count: stats.medium },
    { value: 'low', label: 'Low', count: stats.low }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'weather', label: 'Weather' },
    { value: 'food', label: 'Food' },
    { value: 'official', label: 'Official' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Official Updates</h2>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {filteredUpdates.length} updates
            </span>
          </div>
          
          <button
            onClick={loadOfficialUpdates}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {severityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterSeverity(option.value)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                filterSeverity === option.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-semibold">{option.count}</div>
              <div className="text-xs">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search official updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Sources</option>
                {availableSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading official updates...</p>
            </div>
          </div>
        ) : filteredUpdates.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredUpdates.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onUpdateSelect && onUpdateSelect(update)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getSourceIcon(update.source)}
                      <div>
                        <p className="font-medium text-gray-900">{update.source}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(update.published_at)}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(update.severity)}`}>
                      {update.severity.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {update.title}
                  </h3>

                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {update.content.length > 200 
                      ? `${update.content.substring(0, 200)}...` 
                      : update.content
                    }
                  </p>

                  {update.category && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {getCategoryIcon(update.category)}
                        <span className="ml-1 capitalize">{update.category}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {update.contact && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>{update.contact}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={update.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No official updates found</p>
            <p className="text-sm text-gray-400">
              {searchQuery || filterSource !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your search or filter criteria' 
                : 'Official updates from government agencies will appear here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialUpdates;