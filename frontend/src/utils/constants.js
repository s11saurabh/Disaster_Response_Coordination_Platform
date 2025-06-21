export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  DISASTERS: '/disasters',
  DISASTER_NEW: '/disasters/new',
  DISASTER_DETAIL: '/disasters/:id',
  DISASTER_REPORT: '/disasters/:id/report',
  MAP: '/map',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  SETTINGS: '/settings'
};

export const DISASTER_TYPES = {
  NATURAL: [
    { value: 'earthquake', label: 'Earthquake', icon: '🌍', color: '#8b5cf6' },
    { value: 'flood', label: 'Flood', icon: '🌊', color: '#3b82f6' },
    { value: 'hurricane', label: 'Hurricane', icon: '🌀', color: '#6366f1' },
    { value: 'tornado', label: 'Tornado', icon: '🌪️', color: '#8b5cf6' },
    { value: 'wildfire', label: 'Wildfire', icon: '🔥', color: '#ef4444' },
    { value: 'tsunami', label: 'Tsunami', icon: '🌊', color: '#0ea5e9' },
    { value: 'drought', label: 'Drought', icon: '🏜️', color: '#f59e0b' },
    { value: 'blizzard', label: 'Blizzard', icon: '❄️', color: '#06b6d4' },
    { value: 'volcano', label: 'Volcano', icon: '🌋', color: '#dc2626' },
    { value: 'landslide', label: 'Landslide', icon: '⛰️', color: '#92400e' }
  ],
  HUMAN_MADE: [
    { value: 'explosion', label: 'Explosion', icon: '💥', color: '#dc2626' },
    { value: 'fire', label: 'Fire', icon: '🔥', color: '#ea580c' },
    { value: 'chemical_spill', label: 'Chemical Spill', icon: '☢️', color: '#65a30d' },
    { value: 'building_collapse', label: 'Building Collapse', icon: '🏢', color: '#6b7280' },
    { value: 'transportation_accident', label: 'Transportation Accident', icon: '🚗', color: '#4f46e5' },
    { value: 'power_outage', label: 'Power Outage', icon: '⚡', color: '#fbbf24' }
  ]
};

export const PRIORITY_LEVELS = {
  CRITICAL: {
    value: 'critical',
    label: 'Critical',
    color: '#dc2626',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    description: 'Life-threatening emergency requiring immediate response'
  },
  URGENT: {
    value: 'urgent',
    label: 'Urgent',
    color: '#ea580c',
    bgColor: '#fed7aa',
    textColor: '#c2410c',
    description: 'High priority situation needing rapid response'
  },
  HIGH: {
    value: 'high',
    label: 'High',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#d97706',
    description: 'Significant impact expected, prompt attention needed'
  },
  MEDIUM: {
    value: 'medium',
    label: 'Medium',
    color: '#eab308',
    bgColor: '#fef9c3',
    textColor: '#ca8a04',
    description: 'Standard response time acceptable'
  },
  LOW: {
    value: 'low',
    label: 'Low',
    color: '#22c55e',
    bgColor: '#dcfce7',
    textColor: '#16a34a',
    description: 'Lower priority, can be addressed when resources allow'
  }
};

export const RESOURCE_TYPES = {
  SHELTER: {
    value: 'shelter',
    label: 'Emergency Shelter',
    icon: '🏠',
    color: '#10b981',
    description: 'Safe accommodation for displaced persons'
  },
  FOOD: {
    value: 'food',
    label: 'Food Distribution',
    icon: '🍽️',
    color: '#f59e0b',
    description: 'Food supplies and meal distribution centers'
  },
  WATER: {
    value: 'water',
    label: 'Water Supply',
    icon: '💧',
    color: '#06b6d4',
    description: 'Clean drinking water and distribution points'
  },
  MEDICAL: {
    value: 'medical',
    label: 'Medical Aid',
    icon: '🏥',
    color: '#3b82f6',
    description: 'Medical care, first aid, and emergency treatment'
  },
  TRANSPORTATION: {
    value: 'transportation',
    label: 'Transportation',
    icon: '🚐',
    color: '#8b5cf6',
    description: 'Emergency transportation and evacuation services'
  },
  COMMUNICATION: {
    value: 'communication',
    label: 'Communication Hub',
    icon: '📡',
    color: '#ec4899',
    description: 'Communication services and information centers'
  },
  RESCUE: {
    value: 'rescue',
    label: 'Rescue Operations',
    icon: '🚁',
    color: '#ef4444',
    description: 'Search and rescue operations'
  },
  SUPPLIES: {
    value: 'supplies',
    label: 'Emergency Supplies',
    icon: '📦',
    color: '#6b7280',
    description: 'General emergency supplies and equipment'
  }
};

export const STATUS_TYPES = {
  DISASTER: {
    ACTIVE: { value: 'active', label: 'Active', color: '#ef4444' },
    MONITORING: { value: 'monitoring', label: 'Monitoring', color: '#f59e0b' },
    RESOLVED: { value: 'resolved', label: 'Resolved', color: '#10b981' },
    ARCHIVED: { value: 'archived', label: 'Archived', color: '#6b7280' }
  },
  REPORT: {
    PENDING: { value: 'pending', label: 'Pending Review', color: '#f59e0b' },
    VERIFIED: { value: 'verified', label: 'Verified', color: '#10b981' },
    FLAGGED: { value: 'flagged', label: 'Flagged', color: '#ef4444' },
    REJECTED: { value: 'rejected', label: 'Rejected', color: '#6b7280' }
  }
};

export const USER_ROLES = {
  ADMIN: {
    value: 'admin',
    label: 'Administrator',
    permissions: ['create', 'read', 'update', 'delete', 'verify', 'manage_users'],
    color: '#dc2626'
  },
  COORDINATOR: {
    value: 'coordinator',
    label: 'Emergency Coordinator',
    permissions: ['create', 'read', 'update', 'verify', 'manage_resources'],
    color: '#ea580c'
  },
  CONTRIBUTOR: {
    value: 'contributor',
    label: 'Contributor',
    permissions: ['create', 'read', 'update'],
    color: '#3b82f6'
  },
  CITIZEN: {
    value: 'citizen',
    label: 'Citizen Reporter',
    permissions: ['create', 'read'],
    color: '#10b981'
  }
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT) || 40.7128,
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG) || -74.0060
  ],
  DEFAULT_ZOOM: parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 12,
  MIN_ZOOM: 2,
  MAX_ZOOM: 18,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  DISASTER_CREATED: 'disaster_created',
  DISASTER_UPDATED: 'disaster_updated',
  DISASTER_DELETED: 'disaster_deleted',
  REPORT_CREATED: 'report_created',
  RESOURCE_CREATED: 'resource_created',
  SOCIAL_MEDIA_UPDATED: 'social_media_updated',
  RESOURCES_UPDATED: 'resources_updated',
  URGENT_ALERT: 'urgent_alert',
  SYSTEM_ALERT: 'system_alert',
  JOIN_DISASTER: 'join_disaster',
  LEAVE_DISASTER: 'leave_disaster',
  JOIN_LOCATION: 'join_location',
  EMERGENCY_ALERT: 'emergency_alert'
};

export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

export const VALIDATION_RULES = {
  DISASTER: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 2000,
    LOCATION_MAX_LENGTH: 100,
    MAX_TAGS: 10
  },
  REPORT: {
    CONTENT_MIN_LENGTH: 10,
    CONTENT_MAX_LENGTH: 1000,
    IMAGE_URL_MAX_LENGTH: 500
  },
  RESOURCE: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    CONTACT_INFO_MAX_LENGTH: 200
  }
};

export const FEATURE_FLAGS = {
  REAL_TIME_UPDATES: process.env.REACT_APP_ENABLE_REAL_TIME === 'true',
  NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
  IMAGE_VERIFICATION: true,
  GEOLOCATION: true,
  SOCIAL_MEDIA_MONITORING: true
};

export const UI_CONSTANTS = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  INFINITE_SCROLL_THRESHOLD: 100,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, 
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ITEMS_PER_PAGE: 20,
  SEARCH_MIN_LENGTH: 2
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
};

export const SUCCESS_MESSAGES = {
  DISASTER_CREATED: 'Disaster reported successfully!',
  DISASTER_UPDATED: 'Disaster updated successfully!',
  DISASTER_DELETED: 'Disaster deleted successfully!',
  REPORT_CREATED: 'Report submitted successfully!',
  RESOURCE_CREATED: 'Resource added successfully!',
  IMAGE_VERIFIED: 'Image verification completed successfully!',
  LOCATION_UPDATED: 'Location updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'disaster_app_user_preferences',
  MAP_SETTINGS: 'disaster_app_map_settings',
  FILTER_SETTINGS: 'disaster_app_filter_settings',
  THEME: 'disaster_app_theme',
  LANGUAGE: 'disaster_app_language'
};

export default {
  API_CONFIG,
  ROUTES,
  DISASTER_TYPES,
  PRIORITY_LEVELS,
  RESOURCE_TYPES,
  STATUS_TYPES,
  USER_ROLES,
  MAP_CONFIG,
  WEBSOCKET_EVENTS,
  TIME_CONSTANTS,
  VALIDATION_RULES,
  FEATURE_FLAGS,
  UI_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS
};
