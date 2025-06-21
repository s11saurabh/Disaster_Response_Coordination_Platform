import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  RefreshCw, 
  Filter, 
  Search,
  AlertTriangle,
  Clock,
  Heart,
  Share,
  Tag,
  MapPin,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const SocialMediaPage = () => {
  const { socialMedia } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisasterType, setSelectedDisasterType] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    loadMockSocialMediaPosts();
  }, []);

  const loadMockSocialMediaPosts = async () => {
    setLoading(true);
    try {
      const response = await socialMedia.getMockData({
        keywords: searchQuery,
        disaster_type: selectedDisasterType,
        limit: 100
      });
      
      if (response.success && response.data.posts) {
        setPosts(response.data.posts);
        calculateStats(response.data.posts);
        toast.success('Social media feeds loaded');
      } else {
        toast.error('Failed to load social media posts');
      }
    } catch (error) {
      console.error('Error loading social media posts:', error);
      toast.error('Error loading social media feeds');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData) => {
    const statsData = {
      total: postsData.length,
      urgent: postsData.filter(p => p.priority === 'urgent').length,
      high: postsData.filter(p => p.priority === 'high').length,
      medium: postsData.filter(p => p.priority === 'medium').length,
      low: postsData.filter(p => p.priority === 'low').length
    };
    setStats(statsData);
  };

  const filteredPosts = posts.filter(post => {
    const matchesPriority = filterPriority === 'all' || post.priority === filterPriority;
    const matchesSearch = !searchQuery || 
      post.post.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#\w+/g;
    return text.match(hashtagRegex) || [];
  };

  const priorityOptions = [
    { value: 'all', label: 'All Posts', count: stats.total },
    { value: 'urgent', label: 'Urgent', count: stats.urgent },
    { value: 'high', label: 'High', count: stats.high },
    { value: 'medium', label: 'Medium', count: stats.medium },
    { value: 'low', label: 'Low', count: stats.low }
  ];

  const disasterTypes = [
    { value: '', label: 'All Types' },
    { value: 'flood', label: 'Flood' },
    { value: 'fire', label: 'Fire' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'hurricane', label: 'Hurricane' },
    { value: 'tornado', label: 'Tornado' }
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
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <span>Social Media Monitoring</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time social media posts and alerts for disaster response
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={loadMockSocialMediaPosts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterPriority(option.value)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                filterPriority === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-2xl font-bold">{option.count}</div>
              <div className="text-sm">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts by content, user, or hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedDisasterType}
              onChange={(e) => setSelectedDisasterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {disasterTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>

            <button
              onClick={loadMockSocialMediaPosts}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <h2 className="text-lg font-semibold text-gray-900">Live Social Media Feed</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredPosts.length} posts filtered by priority and keywords
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Loading social media posts...</p>
                <p className="text-gray-500 text-sm mt-2">Fetching latest disaster-related content</p>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {post.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">@{post.user}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {getTimeAgo(post.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPriorityColor(post.priority)}`}>
                      {post.priority.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    {post.post}
                  </p>

                  {post.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="font-medium">{post.location}</span>
                    </div>
                  )}

                  {extractHashtags(post.post).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {extractHashtags(post.post).map((hashtag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <button className="flex items-center space-x-2 hover:text-red-600 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 100)}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                      </button>

                      <button className="flex items-center space-x-2 hover:text-green-600 transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    </div>

                    {post.verified && (
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>

                  {post.relevance_score && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Relevance Score</span>
                        <span className="font-semibold">{post.relevance_score}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(post.relevance_score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No social media posts found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filterPriority !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Social media feeds will appear here when available'
                }
              </p>
              <button
                onClick={loadMockSocialMediaPosts}
                className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Load Sample Data</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SocialMediaPage;