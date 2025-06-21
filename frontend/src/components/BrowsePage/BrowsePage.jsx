import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const BrowsePage = () => {
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
    low: 0,
    sources: 0
  });

  useEffect(() => {
    loadOfficialUpdates();
    loadAvailableSources();
  }, []);

  const loadOfficialUpdates = async () => {
    setLoading(true);
    try {
      const response = await officialUpdates.search({
        q: searchQuery || undefined,
        sources: filterSource !== 'all' ? filterSource : undefined,
        limit: 100
      });
      
      if (response.success && response.data.results) {
        setUpdates(response.data.results);
        calculateStats(response.data.results);
        toast.success('Official updates loaded');
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

  const loadCategoryUpdates = async (category) => {
    setLoading(true);
    try {
      const response = await officialUpdates.getByCategory(category, {
        sources: filterSource !== 'all' ? filterSource : undefined,
        limit: 100
      });
      
      if (response.success && response.data.updates) {
        setUpdates(response.data.updates);
        calculateStats(response.data.updates);
        toast.success(`${category} updates loaded`);
      }
    } catch (error) {
      console.error('Error loading category updates:', error);
      toast.error('Error loading category updates');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (updatesData) => {
    const statsData = {
      total: updatesData.length,
      high: updatesData.filter(u => u.severity === 'high').length,
      medium: updatesData.filter(u => u.severity === 'medium').length,
      low: updatesData.filter(u => u.severity === 'low').length,
      sources: new Set(updatesData.map(u => u.source)).size
    };
    setStats(statsData);
  };

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = !searchQuery || 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || update.severity === filterSeverity;
    const matchesCategory = filterCategory === 'all' || update.category === filterCategory;
    
    return matchesSearch && matchesSeverity && matchesCategory;
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
    if (sourceLower.includes('fema')) return <Shield className="w-6 h-6 text-blue-600" />;
    if (sourceLower.includes('red cross')) return <Heart className="w-6 h-6 text-red-600" />;
    if (sourceLower.includes('weather')) return <Zap className="w-6 h-6 text-yellow-600" />;
    if (sourceLower.includes('nyc') || sourceLower.includes('emergency')) return <Building className="w-6 h-6 text-gray-600" />;
    return <Globe className="w-6 h-6 text-gray-600" />;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'shelter': return <Building className="w-5 h-5" />;
      case 'supplies': return <FileText className="w-5 h-5" />;
      case 'volunteer': return <Users className="w-5 h-5" />;
      case 'weather': return <Zap className="w-5 h-5" />;
      case 'food': return <Heart className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
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
    { value: 'high', label: 'High Priority', count: stats.high },
    { value: 'medium', label: 'Medium Priority', count: stats.medium },
    { value: 'low', label: 'Low Priority', count: stats.low }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'shelter', label: 'Shelter & Housing' },
    { value: 'supplies', label: 'Supplies & Resources' },
    { value: 'volunteer', label: 'Volunteer Services' },
    { value: 'weather', label: 'Weather Alerts' },
    { value: 'food', label: 'Food & Water' },
    { value: 'official', label: 'Official Announcements' }
  ];

  const quickCategories = [
    { key: 'shelter', label: 'Emergency Shelters', icon: Building, color: 'blue' },
    { key: 'weather', label: 'Weather Alerts', icon: Zap, color: 'yellow' },
    { key: 'volunteer', label: 'Volunteer Opportunities', icon: Users, color: 'green' },
    { key: 'supplies', label: 'Emergency Supplies', icon: FileText, color: 'purple' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <Globe className="w-8 h-8 text-green-600" />
            <span>Official Updates & Alerts</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time updates from government agencies and relief organizations
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={loadOfficialUpdates}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Updates</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {severityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterSeverity(option.value)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                filterSeverity === option.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl font-bold">{option.count}</div>
              <div className="text-sm">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => loadCategoryUpdates(category.key)}
              className={`p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md ${
                filterCategory === category.key 
                  ? `border-${category.color}-500 bg-${category.color}-50` 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <category.icon className={`w-8 h-8 mx-auto mb-2 text-${category.color}-600`} />
              <div className="text-sm font-medium text-gray-900">{category.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search official updates by title, content, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Sources</option>
              {availableSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadOfficialUpdates}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Latest Official Updates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredUpdates.length} updates from {stats.sources} sources
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{stats.total} Total</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Last 24h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Loading official updates...</p>
                <p className="text-gray-500 text-sm mt-2">Fetching latest information from agencies</p>
              </div>
            </div>
          ) : filteredUpdates.length > 0 ? (
            <div className="space-y-6">
              {filteredUpdates.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {getSourceIcon(update.source)}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{update.source}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Published {getTimeAgo(update.published_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getSeverityColor(update.severity)}`}>
                        {update.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {update.title}
                  </h2>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {update.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {update.category && (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                            {getCategoryIcon(update.category)}
                            <span className="ml-2 capitalize font-medium">{update.category}</span>
                          </span>
                        </div>
                      )}

                      {update.contact && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span className="font-medium">{update.contact}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={update.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100"
                    >
                      <span>View Full Update</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No official updates found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filterSource !== 'all' || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Official updates from government agencies will appear here'
                }
              </p>
              <button
                onClick={loadOfficialUpdates}
                className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Load Sample Updates</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {availableSources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monitored Sources</h2>
            <p className="text-sm text-gray-600 mt-1">
              Official agencies and organizations providing disaster updates
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableSources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getSourceIcon(source.name)}
                    <h3 className="font-medium text-gray-900">{source.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      source.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {source.active ? 'Active' : 'Inactive'}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BrowsePage;