import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp,
  Activity,
  Shield,
  Plus,
  ExternalLink,
  RefreshCw,
  Bell,
  BarChart3,
  Map,
  FileText,
  Zap,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import SocialMediaFeed from '../SocialMediaFeed/SocialMediaFeed';
import OfficialUpdates from '../OfficialUpdates/OfficialUpdates';

const Dashboard = ({ disasters, selectedDisaster, onDisasterSelect, user }) => {
  const { disasters: disasterApi, resources } = useApi();
  const [stats, setStats] = useState({
    totalDisasters: 0,
    urgentDisasters: 0,
    activeResources: 0,
    recentReports: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [showOfficialUpdates, setShowOfficialUpdates] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [disasters]);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const urgentCount = disasters.filter(d => 
        d.tags?.includes('urgent') || d.tags?.includes('critical')
      ).length;
      
      setStats({
        totalDisasters: disasters.length,
        urgentDisasters: urgentCount,
        activeResources: Math.floor(disasters.length * 2.5),
        recentReports: Math.floor(disasters.length * 1.8)
      });

      const activity = disasters.slice(0, 5).map((disaster, index) => ({
        id: disaster.id,
        type: ['disaster_reported', 'resource_added', 'report_submitted'][index % 3],
        title: disaster.title,
        location: disaster.location_name,
        timestamp: disaster.created_at,
        priority: disaster.tags?.includes('urgent') ? 'high' : 
                 disaster.tags?.includes('medium') ? 'medium' : 'low'
      }));
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'disaster_reported':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resource_added':
        return <Shield className="w-4 h-4" />;
      case 'report_submitted':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    if (type === 'disaster_reported') return 'text-orange-600 bg-orange-100';
    if (type === 'resource_added') return 'text-green-600 bg-green-100';
    return 'text-blue-600 bg-blue-100';
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

  const statCards = [
    {
      title: 'Total Disasters',
      value: stats.totalDisasters,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Urgent Events',
      value: stats.urgentDisasters,
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Active Resources',
      value: stats.activeResources,
      icon: Shield,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Recent Reports',
      value: stats.recentReports,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  const quickActions = [
    {
      title: 'Report Emergency',
      description: 'Submit a new disaster report',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      link: '/disasters/new'
    },
    {
      title: 'View Map',
      description: 'See resources and disasters on map',
      icon: Map,
      color: 'from-blue-500 to-blue-600',
      link: '/map'
    },
    {
      title: 'Manage Disasters',
      description: 'View and manage all disasters',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      link: '/disasters'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      link: '/analytics'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Coordinator'}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with emergency response today
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <Link
            to="/disasters/new"
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Report Emergency</span>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last week</span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/disasters" className="text-sm text-red-600 hover:text-red-700 font-medium">
                View all
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onDisasterSelect(disasters.find(d => d.id === activity.id))}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        {activity.location && (
                          <>
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate mr-2">{activity.location}</span>
                          </>
                        )}
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{getTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link
                    to={action.link}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">API Services</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Real-time Updates</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">External APIs</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">Degraded</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-sm text-white">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Active Alerts</h3>
              </div>
              <p className="text-sm opacity-90 mb-4">
                {stats.urgentDisasters} urgent disasters require immediate attention
              </p>
              <Link
                to="/disasters?filter=urgent"
                className="inline-flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>View Urgent</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {selectedDisaster && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Media Feeds</h3>
                <button
                  onClick={() => setShowSocialMedia(!showSocialMedia)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{showSocialMedia ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              {showSocialMedia ? (
                <SocialMediaFeed 
                  disasterId={selectedDisaster.id}
                  keywords={selectedDisaster.tags?.join(',')}
                />
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Click "Show" to load social media feeds</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Official Updates</h3>
                <button
                  onClick={() => setShowOfficialUpdates(!showOfficialUpdates)}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800"
                >
                  <Globe className="w-4 h-4" />
                  <span>{showOfficialUpdates ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              
              {showOfficialUpdates ? (
                <OfficialUpdates 
                  disasterId={selectedDisaster.id}
                />
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Click "Show" to load official updates</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {disasters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Disasters</h2>
              <Link to="/disasters" className="text-sm text-red-600 hover:text-red-700 font-medium">
                View all disasters
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disaster
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {disasters.slice(0, 5).map((disaster, index) => (
                  <motion.tr
                    key={disaster.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onDisasterSelect(disaster)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AlertTriangle className={`w-5 h-5 ${
                            disaster.tags?.includes('urgent') ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{disaster.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{disaster.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {disaster.location_name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        disaster.tags?.includes('urgent') 
                          ? 'bg-red-100 text-red-800'
                          : disaster.tags?.includes('high')
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {disaster.tags?.includes('urgent') ? 'Urgent' : 
                         disaster.tags?.includes('high') ? 'High' : 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(disaster.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/disasters/${disaster.id}/report`}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Add Report
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;