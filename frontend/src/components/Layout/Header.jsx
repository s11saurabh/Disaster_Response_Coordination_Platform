import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Shield, 
  Wifi, 
  WifiOff, 
  User,
  AlertTriangle,
  MessageCircle,
  Globe
} from 'lucide-react';

const Header = ({ user, connected, onMenuClick }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/disasters':
        return 'Disaster Management';
      case '/disasters/new':
        return 'Report New Disaster';
      case '/social-media':
        return 'Social Media Monitoring';
      case '/browse':
        return 'Official Updates';
      case '/map':
        return 'Resource Map';
      default:
        if (location.pathname.includes('/disasters/') && location.pathname.includes('/report')) {
          return 'Submit Report';
        }
        return 'Disaster Response';
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
    >
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-2 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 lg:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo and Title */}
            <Link to="/" className="flex items-center space-x-2 group min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
              </div>
              
              <div className="hidden sm:block min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent whitespace-nowrap">
                  Emergency Response
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5 whitespace-nowrap">Coordination Platform</p>
              </div>
            </Link>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-4">
            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
              <NavLink to="/" active={location.pathname === '/'}>
                Dashboard
              </NavLink>
              <NavLink to="/disasters" active={location.pathname === '/disasters'}>
                Disasters
              </NavLink>
              <NavLink to="/social-media" active={location.pathname === '/social-media'}>
                <div className="flex items-center space-x-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Social Media</span>
                </div>
              </NavLink>
              <NavLink to="/browse" active={location.pathname === '/browse'}>
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Browse</span>
                </div>
              </NavLink>
              <NavLink to="/map" active={location.pathname === '/map'}>
                Map
              </NavLink>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Connection Status */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Quick Action Button */}
            <Link
              to="/disasters/new"
              className="flex items-center space-x-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Emergency</span>
              <span className="sm:hidden">Report</span>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Coordinator'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
                </div>
              </button>

              {/* User Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.name || 'Emergency Coordinator'}</p>
                    <p className="text-sm text-gray-500">{user?.username || 'netrunnerX'}</p>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Preferences
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Page Title */}
      <div className="lg:hidden px-4 pb-3 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
      </div>
    </motion.header>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-white text-red-700 shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
    }`}
  >
    {children}
  </Link>
);

export default Header;