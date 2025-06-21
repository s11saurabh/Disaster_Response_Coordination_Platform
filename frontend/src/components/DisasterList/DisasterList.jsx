import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Eye, 
  FileText, 
  MoreVertical,
  RefreshCw,
  Download,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  X,
  MessageCircle,
  Globe,
  TrendingUp
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const DisasterList = ({ disasters, onDisasterSelect, selectedDisaster }) => {
  const { disasters: disasterApi, socialMedia, officialUpdates } = useApi();
  const [filteredDisasters, setFilteredDisasters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [socialMediaCounts, setSocialMediaCounts] = useState({});
  const [officialUpdateCounts, setOfficialUpdateCounts] = useState({});

  useEffect(() => {
    filterAndSortDisasters();
  }, [disasters, searchQuery, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (disasters.length > 0) {
      loadSocialMediaCounts();
      loadOfficialUpdateCounts();
    }
  }, [disasters]);

  const loadSocialMediaCounts = async () => {
    const counts = {};
    for (const disaster of disasters.slice(0, 10)) {
      try {
        const response = await socialMedia.getReports(disaster.id, { limit: 1 });
        if (response.success && response.data.total_posts) {
          counts[disaster.id] = response.data.total_posts;
        }
      } catch (error) {
        console.error(`Error loading social media count for ${disaster.id}:`, error);
      }
    }
    setSocialMediaCounts(counts);
  };

  const loadOfficialUpdateCounts = async () => {
    const counts = {};
    for (const disaster of disasters.slice(0, 10)) {
      try {
        const response = await officialUpdates.getForDisaster(disaster.id, { limit: 1 });
        if (response.success && response.data.total_updates) {
          counts[disaster.id] = response.data.total_updates;
        }
      } catch (error) {
        console.error(`Error loading official updates count for ${disaster.id}:`, error);
      }
    }
    setOfficialUpdateCounts(counts);
  };

  const filterAndSortDisasters = () => {
    let filtered = [...disasters];

    if (searchQuery) {
      filtered = filtered.filter(disaster =>
        disaster.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disaster.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disaster.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(disaster => {
        if (activeFilter === 'urgent') {
          return disaster.tags?.includes('urgent') || disaster.tags?.includes('critical');
        }
        return disaster.tags?.includes(activeFilter);
      });
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    setFilteredDisasters(filtered);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setBulkActionLoading(true);
    try {
      await loadSocialMediaCounts();
      await loadOfficialUpdateCounts();
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setBulkActionLoading(false);
    }
  };

  const handleSelectItem = (disasterId) => {
    setSelectedItems(prev => 
      prev.includes(disasterId) 
        ? prev.filter(id => id !== disasterId)
        : [...prev, disasterId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredDisasters.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredDisasters.map(d => d.id));
    }
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) {
      toast.error('No disasters selected for export');
      return;
    }

    const selectedDisasters = filteredDisasters.filter(d => selectedItems.includes(d.id));
    
    const csvHeaders = ['Title', 'Location', 'Description', 'Priority', 'Tags', 'Created Date', 'Owner', 'Social Media Posts', 'Official Updates'];
    const csvData = selectedDisasters.map(disaster => [
      disaster.title,
      disaster.location_name || 'Unknown',
      disaster.description?.replace(/"/g, '""') || '',
      getPriorityLabel(disaster.tags),
      disaster.tags?.join('; ') || '',
      new Date(disaster.created_at).toLocaleDateString(),
      disaster.owner_id,
      socialMediaCounts[disaster.id] || 0,
      officialUpdateCounts[disaster.id] || 0
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `disasters_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${selectedItems.length} disaster(s) to CSV`);
  };

  const handleArchiveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error('No disasters selected for archiving');
      return;
    }

    const confirmArchive = window.confirm(
      `Are you sure you want to archive ${selectedItems.length} disaster(s)? This action can be undone.`
    );

    if (!confirmArchive) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const disasterId of selectedItems) {
        try {
          const disaster = disasters.find(d => d.id === disasterId);
          if (disaster) {
            const response = await disasterApi.update(disasterId, {
              ...disaster,
              tags: [...(disaster.tags || []), 'archived'],
              status: 'archived'
            });
            
            if (response.success) {
              successCount++;
            } else {
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`Error archiving disaster ${disasterId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully archived ${successCount} disaster(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to archive ${errorCount} disaster(s)`);
      }

      setSelectedItems([]);
      window.location.reload();

    } catch (error) {
      toast.error('Failed to archive disasters');
      console.error('Bulk archive error:', error);
    } finally {
      setLoading(false);
      setBulkActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error('No disasters selected for deletion');
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to permanently delete ${selectedItems.length} disaster(s)? This action cannot be undone!`
    );

    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      'This will permanently delete all selected disasters and their associated reports. Type "DELETE" to confirm.'
    );

    if (!doubleConfirm) return;

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const disasterId of selectedItems) {
        try {
          const response = await disasterApi.delete(disasterId);
          
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error deleting disaster ${disasterId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} disaster(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} disaster(s)`);
      }

      setSelectedItems([]);
      window.location.reload();

    } catch (error) {
      toast.error('Failed to delete disasters');
      console.error('Bulk delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (tags) => {
    if (tags?.includes('critical')) return 'bg-red-600';
    if (tags?.includes('urgent')) return 'bg-red-500';
    if (tags?.includes('high')) return 'bg-orange-500';
    if (tags?.includes('medium')) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityLabel = (tags) => {
    if (tags?.includes('critical')) return 'Critical';
    if (tags?.includes('urgent')) return 'Urgent';
    if (tags?.includes('high')) return 'High';
    if (tags?.includes('medium')) return 'Medium';
    return 'Low';
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

  const filterOptions = [
    { value: 'all', label: 'All Disasters', count: disasters.length },
    { value: 'urgent', label: 'Urgent', count: disasters.filter(d => d.tags?.includes('urgent') || d.tags?.includes('critical')).length },
    { value: 'flood', label: 'Floods', count: disasters.filter(d => d.tags?.includes('flood')).length },
    { value: 'fire', label: 'Fires', count: disasters.filter(d => d.tags?.includes('fire')).length },
    { value: 'earthquake', label: 'Earthquakes', count: disasters.filter(d => d.tags?.includes('earthquake')).length },
    { value: 'hurricane', label: 'Hurricanes', count: disasters.filter(d => d.tags?.includes('hurricane')).length }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'title', label: 'Title' },
    { value: 'location_name', label: 'Location' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disaster Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all disaster reports ({filteredDisasters.length} of {disasters.length})
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search disasters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedItems.length} disaster{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportSelected}
                  disabled={bulkActionLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Selected</span>
                </button>
                
                <button
                  onClick={handleArchiveSelected}
                  disabled={bulkActionLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkActionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>Archive</span>
                </button>
                
                <button
                  onClick={handleDeleteSelected}
                  disabled={bulkActionLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkActionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>Delete</span>
                </button>
                
                <button
                  onClick={() => setSelectedItems([])}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {filteredDisasters.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDisasters.map((disaster, index) => (
                  <DisasterCard
                    key={disaster.id}
                    disaster={disaster}
                    index={index}
                    selectedDisaster={selectedDisaster}
                    onDisasterSelect={onDisasterSelect}
                    onSelectItem={handleSelectItem}
                    isSelected={selectedItems.includes(disaster.id)}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getTimeAgo={getTimeAgo}
                    socialMediaCount={socialMediaCounts[disaster.id] || 0}
                    officialUpdateCount={officialUpdateCounts[disaster.id] || 0}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredDisasters.length && filteredDisasters.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </th>
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
                          Social Media
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Official Updates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDisasters.map((disaster, index) => (
                        <DisasterRow
                          key={disaster.id}
                          disaster={disaster}
                          index={index}
                          selectedDisaster={selectedDisaster}
                          onDisasterSelect={onDisasterSelect}
                          onSelectItem={handleSelectItem}
                          isSelected={selectedItems.includes(disaster.id)}
                          getPriorityColor={getPriorityColor}
                          getPriorityLabel={getPriorityLabel}
                          getTimeAgo={getTimeAgo}
                          socialMediaCount={socialMediaCounts[disaster.id] || 0}
                          officialUpdateCount={officialUpdateCounts[disaster.id] || 0}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disasters found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || activeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by reporting your first emergency'
              }
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <Link
                to="/disasters/new"
                className="inline-flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Report Emergency</span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DisasterCard = ({ 
  disaster, 
  index, 
  selectedDisaster, 
  onDisasterSelect, 
  onSelectItem, 
  isSelected,
  getPriorityColor,
  getPriorityLabel,
  getTimeAgo,
  socialMediaCount,
  officialUpdateCount
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
      selectedDisaster?.id === disaster.id
        ? 'border-red-500 ring-2 ring-red-200'
        : 'border-gray-200 hover:border-gray-300'
    }`}
    onClick={() => onDisasterSelect(disaster)}
  >
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(disaster.tags)}`}></div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {getPriorityLabel(disaster.tags)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectItem(disaster.id);
            }}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {disaster.title}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {disaster.description}
      </p>

      {disaster.location_name && (
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{disaster.location_name}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>{getTimeAgo(disaster.created_at)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/disasters/${disaster.id}/report`}
            onClick={(e) => e.stopPropagation()}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            <FileText className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDisasterSelect(disaster);
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>{socialMediaCount} posts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Globe className="w-3 h-3" />
            <span>{officialUpdateCount} updates</span>
          </div>
        </div>
      </div>

      {disaster.tags && disaster.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
          {disaster.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize"
            >
              {tag}
            </span>
          ))}
          {disaster.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{disaster.tags.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

const DisasterRow = ({ 
  disaster, 
  index, 
  selectedDisaster, 
  onDisasterSelect, 
  onSelectItem, 
  isSelected,
  getPriorityColor,
  getPriorityLabel,
  getTimeAgo,
  socialMediaCount,
  officialUpdateCount
}) => (
  <motion.tr
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`hover:bg-gray-50 cursor-pointer ${
      selectedDisaster?.id === disaster.id ? 'bg-red-50' : ''
    }`}
    onClick={() => onDisasterSelect(disaster)}
  >
    <td className="px-6 py-4">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelectItem(disaster.id);
        }}
        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
      />
    </td>
    
    <td className="px-6 py-4">
      <div className="flex items-center">
        <AlertTriangle className={`w-5 h-5 mr-3 ${
          disaster.tags?.includes('urgent') ? 'text-red-500' : 'text-yellow-500'
        }`} />
        <div>
          <div className="text-sm font-medium text-gray-900">{disaster.title}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">{disaster.description}</div>
        </div>
      </div>
    </td>
    
    <td className="px-6 py-4 whitespace-nowrap">
      {disaster.location_name ? (
        <div className="flex items-center text-sm text-gray-900">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
          {disaster.location_name}
        </div>
      ) : (
        <span className="text-sm text-gray-500">Unknown</span>
      )}
    </td>
    
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        disaster.tags?.includes('critical') ? 'bg-red-200 text-red-800' :
        disaster.tags?.includes('urgent') ? 'bg-red-100 text-red-800' :
        disaster.tags?.includes('high') ? 'bg-orange-100 text-orange-800' :
        disaster.tags?.includes('medium') ? 'bg-yellow-100 text-yellow-800' :
        'bg-green-100 text-green-800'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-1.5 ${getPriorityColor(disaster.tags)}`}></div>
        {getPriorityLabel(disaster.tags)}
      </span>
    </td>

    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center text-sm text-gray-600">
        <MessageCircle className="w-4 h-4 mr-1" />
        <span>{socialMediaCount}</span>
      </div>
    </td>

    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center text-sm text-gray-600">
        <Globe className="w-4 h-4 mr-1" />
        <span>{officialUpdateCount}</span>
      </div>
    </td>
    
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="w-4 h-4 mr-1" />
        {getTimeAgo(disaster.created_at)}
      </div>
    </td>
    
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <Link
          to={`/disasters/${disaster.id}/report`}
          onClick={(e) => e.stopPropagation()}
          className="text-red-600 hover:text-red-900 text-sm font-medium"
        >
          Add Report
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDisasterSelect(disaster);
          }}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          View
        </button>
      </div>
    </td>
  </motion.tr>
);

export default DisasterList;