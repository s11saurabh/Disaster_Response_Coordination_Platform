const MESSAGES = {
  SUCCESS: {
    DISASTER_CREATED: 'Disaster record created successfully',
    DISASTER_UPDATED: 'Disaster record updated successfully',
    DISASTER_DELETED: 'Disaster record deleted successfully',
    REPORT_CREATED: 'Report submitted successfully',
    RESOURCE_CREATED: 'Resource added successfully',
    IMAGE_VERIFIED: 'Image verification completed',
    LOCATION_GEOCODED: 'Location geocoded successfully'
  },
  ERROR: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT: 'Rate limit exceeded',
    GEOCODING_FAILED: 'Failed to geocode location',
    EXTERNAL_API_ERROR: 'External API error',
    IMAGE_VERIFICATION_FAILED: 'Image verification failed'
  }
};

const DISASTER_TYPES = {
  NATURAL: [
    'earthquake',
    'flood',
    'hurricane',
    'tornado',
    'wildfire',
    'tsunami',
    'drought',
    'blizzard',
    'volcano',
    'landslide',
    'avalanche',
    'heatwave',
    'cyclone'
  ],
  HUMAN_MADE: [
    'explosion',
    'fire',
    'chemical_spill',
    'nuclear_accident',
    'terrorism',
    'building_collapse',
    'transportation_accident',
    'power_outage',
    'cyberattack'
  ],
  HEALTH: [
    'pandemic',
    'epidemic',
    'contamination',
    'disease_outbreak'
  ],
  ENVIRONMENTAL: [
    'oil_spill',
    'air_pollution',
    'water_contamination',
    'toxic_waste'
  ]
};

const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical'
};

const RESOURCE_TYPES = {
  SHELTER: 'shelter',
  FOOD: 'food',
  WATER: 'water',
  MEDICAL: 'medical',
  TRANSPORTATION: 'transportation',
  COMMUNICATION: 'communication',
  RESCUE: 'rescue',
  SUPPLIES: 'supplies',
  CLOTHING: 'clothing',
  FUEL: 'fuel'
};

const USER_ROLES = {
  ADMIN: {
    name: 'admin',
    permissions: ['create', 'read', 'update', 'delete', 'verify', 'manage_users']
  },
  COORDINATOR: {
    name: 'coordinator',
    permissions: ['create', 'read', 'update', 'verify', 'manage_resources']
  },
  CONTRIBUTOR: {
    name: 'contributor',
    permissions: ['create', 'read', 'update']
  },
  CITIZEN: {
    name: 'citizen',
    permissions: ['create', 'read']
  },
  VIEWER: {
    name: 'viewer',
    permissions: ['read']
  }
};

const STATUS_TYPES = {
  DISASTER: {
    ACTIVE: 'active',
    MONITORING: 'monitoring',
    RESOLVED: 'resolved',
    ARCHIVED: 'archived'
  },
  REPORT: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    FLAGGED: 'flagged',
    REJECTED: 'rejected'
  },
  RESOURCE: {
    AVAILABLE: 'available',
    LIMITED: 'limited',
    UNAVAILABLE: 'unavailable',
    DEPLETED: 'depleted'
  }
};

const SOCIAL_MEDIA_KEYWORDS = {
  EMERGENCY: [
    'emergency',
    'urgent',
    'help',
    'sos',
    'rescue',
    'trapped',
    'stranded',
    'evacuate',
    'shelter',
    'medical',
    'ambulance',
    'fire',
    'police'
  ],
  DISASTER_SPECIFIC: {
    FLOOD: ['flood', 'flooding', 'water', 'river', 'dam', 'levee'],
    EARTHQUAKE: ['earthquake', 'quake', 'tremor', 'seismic', 'richter'],
    FIRE: ['fire', 'smoke', 'burning', 'flames', 'wildfire'],
    HURRICANE: ['hurricane', 'storm', 'wind', 'rain', 'tornado'],
    SNOW: ['blizzard', 'snow', 'ice', 'cold', 'freeze']
  },
  RELIEF: [
    'relief',
    'aid',
    'volunteer',
    'donate',
    'supplies',
    'food',
    'water',
    'clothing',
    'shelter',
    'assistance'
  ]
};

const GEO_CONSTANTS = {
  DEFAULT_RADIUS: 10000,
  MAX_RADIUS: 100000,
  COORDINATE_PRECISION: 6,
  SRID: 4326
};

const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60 * 1000,
    MEDIUM: 30 * 60 * 1000,
    LONG: 60 * 60 * 1000,
    VERY_LONG: 24 * 60 * 60 * 1000
  },
  KEYS: {
    SOCIAL_MEDIA: 'social_media',
    GEOCODING: 'geocode',
    REVERSE_GEOCODING: 'reverse_geocode',
    OFFICIAL_UPDATES: 'official_updates',
    IMAGE_VERIFICATION: 'image_verify',
    NEARBY_RESOURCES: 'nearby_resources'
  }
};

const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100
  },
  API_CALLS: {
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 10
  },
  VERIFICATION: {
    WINDOW_MS: 5 * 60 * 1000,
    MAX_REQUESTS: 5
  },
  CREATE: {
    WINDOW_MS: 10 * 60 * 1000,
    MAX_REQUESTS: 20
  }
};

const VALIDATION = {
  DISASTER: {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 2000,
    LOCATION_NAME_MAX_LENGTH: 100,
    MAX_TAGS: 10
  },
  REPORT: {
    CONTENT_MAX_LENGTH: 1000,
    IMAGE_URL_MAX_LENGTH: 500
  },
  RESOURCE: {
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 1000,
    CONTACT_INFO_MAX_LENGTH: 200
  }
};

const EXTERNAL_APIS = {
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    MODELS: {
      TEXT: 'gemini-pro',
      VISION: 'gemini-pro-vision'
    }
  },
  GOOGLE_MAPS: {
    GEOCODING: 'https://maps.googleapis.com/maps/api/geocode/json',
    REVERSE_GEOCODING: 'https://maps.googleapis.com/maps/api/geocode/json'
  },
  MAPBOX: {
    GEOCODING: 'https://api.mapbox.com/geocoding/v5/mapbox.places'
  },
  NOMINATIM: {
    GEOCODING: 'https://nominatim.openstreetmap.org/search',
    REVERSE_GEOCODING: 'https://nominatim.openstreetmap.org/reverse'
  }
};

const WEBSOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_DISASTER: 'join_disaster',
  LEAVE_DISASTER: 'leave_disaster',
  JOIN_LOCATION: 'join_location',
  DISASTER_CREATED: 'disaster_created',
  DISASTER_UPDATED: 'disaster_updated',
  DISASTER_DELETED: 'disaster_deleted',
  REPORT_CREATED: 'report_created',
  RESOURCE_CREATED: 'resource_created',
  SOCIAL_MEDIA_UPDATED: 'social_media_updated',
  RESOURCES_UPDATED: 'resources_updated',
  URGENT_ALERT: 'urgent_alert',
  SYSTEM_ALERT: 'system_alert',
  USER_TYPING: 'user_typing',
  EMERGENCY_ALERT: 'emergency_alert'
};

module.exports = {
  MESSAGES,
  DISASTER_TYPES,
  PRIORITY_LEVELS,
  RESOURCE_TYPES,
  USER_ROLES,
  STATUS_TYPES,
  SOCIAL_MEDIA_KEYWORDS,
  GEO_CONSTANTS,
  CACHE_CONFIG,
  RATE_LIMITS,
  VALIDATION,
  EXTERNAL_APIS,
  WEBSOCKET_EVENTS
};
