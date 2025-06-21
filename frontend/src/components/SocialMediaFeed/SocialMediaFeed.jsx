import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  RefreshCw, 
  Filter, 
  Search,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Heart,
  Share,
  ExternalLink,
  Tag,
  MapPin
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const SocialMediaFeed = ({ disasterId, keywords, onPostSelect }) => {
  const { socialMedia } = useApi();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    if (disasterId) {
      loadSocialMediaPosts();
    }
  }, [disasterId, keywords]);

  const loadSocialMediaPosts = async () => {
    setLoading(true);
    try {
      const response = await socialMedia.getReports(disasterId, {
        keywords,
        limit: 50
      });
      
      if (response.success && response.data.posts) {
        setPosts(response.data.posts);
        calculateStats(response.data.posts);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Social Media Feed</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {filteredPosts.length} posts
            </span>
          </div>
          
          <button
            onClick={loadSocialMediaPosts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterPriority(option.value)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                filterPriority === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-semibold">{option.count}</div>
              <div className="text-xs">{option.label}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
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
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading social media posts...</p>
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPostSelect && onPostSelect(post)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">@{post.user}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(post.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(post.priority)}`}>
                      {post.priority.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-3 leading-relaxed">
                    {post.post}
                  </p>

                  {post.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {post.location}
                    </div>
                  )}

                  {extractHashtags(post.post).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {extractHashtags(post.post).map((hashtag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-red-600 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 50)}</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>

                    {post.verified && (
                      <span className="flex items-center text-xs text-green-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>

                  {post.relevance_score && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Relevance Score</span>
                        <span className="font-medium">{post.relevance_score}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${(post.relevance_score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No social media posts found</p>
            <p className="text-sm text-gray-400">
              {searchQuery || filterPriority !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Social media feeds will appear here when available'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaFeed;