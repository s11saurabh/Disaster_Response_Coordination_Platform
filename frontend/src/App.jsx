import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import DisasterForm from './components/DisasterForm/DisasterForm';
import DisasterList from './components/DisasterList/DisasterList';
import ReportForm from './components/ReportForm/ReportForm';
import ResourceMap from './components/ResourceMap/ResourceMap';
import SocialMediaPage from './components/SocialMediaPage/SocialMediaPage';
import BrowsePage from './components/BrowsePage/BrowsePage';

import { useWebSocket } from './hooks/useWebSocket';
import { useApi } from './hooks/useApi';

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  const { connected, emit } = useWebSocket();
  const { request } = useApi();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const defaultUser = {
          id: process.env.REACT_APP_DEFAULT_USER_ID || 'netrunnerX',
          username: 'netrunnerX',
          role: 'admin',
          name: 'Emergency Coordinator'
        };
        
        setUser(defaultUser);
        
        const response = await request('get', '/disasters');
        if (response.success) {
          setDisasters(response.data);
        }
        
        if (connected) {
          toast.success('Connected to real-time updates');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to initialize application');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [connected, request]);

  useEffect(() => {
    if (!connected) return;

    const handleDisasterCreated = (data) => {
      setDisasters(prev => [data, ...prev]);
      toast.success(`New disaster reported: ${data.title}`);
    };

    const handleDisasterUpdated = (data) => {
      setDisasters(prev => 
        prev.map(disaster => 
          disaster.id === data.id ? data : disaster
        )
      );
      toast.success(`Disaster updated: ${data.title}`);
    };

    const handleDisasterDeleted = (data) => {
      setDisasters(prev => 
        prev.filter(disaster => disaster.id !== data.id)
      );
      toast.success('Disaster record deleted');
    };

    const handleUrgentAlert = (data) => {
      toast.error(`URGENT: ${data.message}`, {
        duration: 10000,
        icon: '🚨',
      });
    };

    window.socket?.on('disaster_created', handleDisasterCreated);
    window.socket?.on('disaster_updated', handleDisasterUpdated);
    window.socket?.on('disaster_deleted', handleDisasterDeleted);
    window.socket?.on('urgent_alert', handleUrgentAlert);

    return () => {
      window.socket?.off('disaster_created', handleDisasterCreated);
      window.socket?.off('disaster_updated', handleDisasterUpdated);
      window.socket?.off('disaster_deleted', handleDisasterDeleted);
      window.socket?.off('urgent_alert', handleUrgentAlert);
    };
  }, [connected]);

  const handleDisasterCreated = (newDisaster) => {
    setDisasters(prev => [newDisaster, ...prev]);
    setSelectedDisaster(newDisaster);
    toast.success('Disaster reported successfully');
  };

  const handleDisasterSelect = (disaster) => {
    setSelectedDisaster(disaster);
    if (connected && disaster?.id) {
      emit('join_disaster', disaster.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Disaster Response Platform</h2>
          <p className="text-gray-400">Connecting to real-time services...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        connected={connected}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex">
        <AnimatePresence>
          {sidebarOpen && (
            <Sidebar 
              onClose={() => setSidebarOpen(false)}
              selectedDisaster={selectedDisaster}
              onDisasterSelect={handleDisasterSelect}
            />
          )}
        </AnimatePresence>
        <main className="flex-1 p-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  disasters={disasters}
                  selectedDisaster={selectedDisaster}
                  onDisasterSelect={handleDisasterSelect}
                  user={user}
                />
              } 
            />
            <Route 
              path="/disasters" 
              element={
                <DisasterList 
                  disasters={disasters}
                  onDisasterSelect={handleDisasterSelect}
                  selectedDisaster={selectedDisaster}
                />
              } 
            />
            <Route 
              path="/disasters/new" 
              element={
                <DisasterForm 
                  onDisasterCreated={handleDisasterCreated}
                  user={user}
                />
              } 
            />
            <Route 
              path="/disasters/:id/report" 
              element={
                <ReportForm 
                  disaster={selectedDisaster}
                  user={user}
                />
              } 
            />
            <Route 
              path="/map" 
              element={
                <ResourceMap 
                  disasters={disasters}
                  selectedDisaster={selectedDisaster}
                  onDisasterSelect={handleDisasterSelect}
                />
              } 
            />
            <Route 
              path="/social-media" 
              element={<SocialMediaPage />} 
            />
            <Route 
              path="/browse" 
              element={<BrowsePage />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <AnimatePresence>
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Reconnecting...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
