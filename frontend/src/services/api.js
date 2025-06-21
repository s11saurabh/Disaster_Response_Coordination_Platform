import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DEFAULT_USER_ID = process.env.REACT_APP_DEFAULT_USER_ID || 'netrunnerX';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers['x-user-id'] = DEFAULT_USER_ID;
    config.headers['x-request-time'] = new Date().toISOString();
    config.headers['x-request-id'] = generateRequestId();
    
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log(`📤 API Request [${config.headers['x-request-id']}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      const requestId = response.config.headers['x-request-id'];
      console.log(`📥 API Response [${requestId}]:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        duration: calculateDuration(response.config.headers['x-request-time'])
      });
    }
    
    return response;
  },
  (error) => {
    const requestId = error.config?.headers?.['x-request-id'];
    
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.error(`❌ API Error [${requestId}]:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.warn('🔐 Unauthorized access - check authentication');
          break;
        case 403:
          console.warn('🚫 Forbidden access - insufficient permissions');
          break;
        case 404:
          console.warn('🔍 Resource not found');
          break;
        case 429:
          console.warn('⏱️ Rate limit exceeded');
          break;
        case 500:
          console.error('🔥 Server error');
          break;
        default:
          console.error(`🔧 HTTP ${status} error:`, data?.error || error.message);
      }
    } else if (error.request) {
      console.error('🌐 Network error or no response:', error.message);
    } else {
      console.error('⚙️ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateDuration(startTime) {
  if (!startTime) return null;
  const start = new Date(startTime);
  const end = new Date();
  return `${end.getTime() - start.getTime()}ms`;
}

export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      healthy: true,
      status: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const testConnection = async () => {
  try {
    const startTime = performance.now();
    await api.get('/health');
    const endTime = performance.now();
    
    return {
      connected: true,
      latency: Math.round(endTime - startTime),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (error.response?.status && [400, 401, 403, 404, 422].includes(error.response.status)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

export const apiWithRetry = {
  get: (url, config = {}) => retryRequest(() => api.get(url, config)),
  post: (url, data, config = {}) => retryRequest(() => api.post(url, data, config)),
  put: (url, data, config = {}) => retryRequest(() => api.put(url, data, config)),
  patch: (url, data, config = {}) => retryRequest(() => api.patch(url, data, config)),
  delete: (url, config = {}) => retryRequest(() => api.delete(url, config))
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
};

export const uploadWithProgress = async (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
};

export const batchRequests = async (requests, concurrency = 3) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchPromises = batch.map(async (request) => {
      try {
        const response = await api(request);
        return { success: true, data: response.data, config: request };
      } catch (error) {
        return { success: false, error: error.message, config: request };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

const socialMediaApi = {
  getReports: async (disasterId, params = {}) => {
    try {
      console.log('🔍 Fetching social media reports for disaster:', disasterId);
      const response = await api.get(`/disasters/${disasterId}/social-media`, { params });
      console.log('✅ Social media response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Social media error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        fallback: true
      };
    }
  },
  
  getMockData: async (params = {}) => {
    try {
      console.log('🔍 Fetching mock social media data with params:', params);
      const response = await api.get('/mock-social-media', { params });
      console.log('✅ Mock social media response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Mock social media error:', error);
      
      const mockFallbackData = {
        message: 'Mock social media data',
        total_posts: 6,
        posts: [
          {
            id: '1',
            post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
            user: 'citizen_helper1',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            verified: false,
            location: 'Lower Manhattan, NYC',
            hashtags: ['#floodrelief', '#emergency'],
            relevance_score: 8
          },
          {
            id: '2',
            post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
            user: 'brooklyn_resident',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            verified: false,
            location: 'Brooklyn Heights, NYC',
            hashtags: ['#disasterhelp', '#shelter'],
            relevance_score: 6
          },
          {
            id: '3',
            post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
            user: 'medical_volunteer',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            priority: 'urgent',
            verified: false,
            location: '42nd Street, NYC',
            hashtags: ['#emergencyhelp', '#medical'],
            relevance_score: 9
          },
          {
            id: '4',
            post: 'Earthquake felt in downtown area. Buildings shaking! #earthquake #help',
            user: 'downtown_witness',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            priority: 'urgent',
            verified: false,
            location: 'Downtown',
            hashtags: ['#earthquake', '#help'],
            relevance_score: 10
          },
          {
            id: '5',
            post: 'Fire spreading near residential area. Evacuations needed! #fire #evacuate',
            user: 'safety_alert',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            priority: 'urgent',
            verified: false,
            location: 'Residential District',
            hashtags: ['#fire', '#evacuate'],
            relevance_score: 9
          },
          {
            id: '6',
            post: 'Have extra blankets and warm clothes for disaster victims #donate #help',
            user: 'community_helper',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            priority: 'low',
            verified: false,
            location: 'Community Center',
            hashtags: ['#donate', '#help'],
            relevance_score: 4
          }
        ]
      };
      
      console.log('📦 Using fallback mock data');
      return { 
        success: true, 
        data: mockFallbackData,
        fallback: true
      };
    }
  }
};

const officialUpdatesApi = {
  getForDisaster: async (disasterId, params = {}) => {
    try {
      console.log('🔍 Fetching official updates for disaster:', disasterId);
      const response = await api.get(`/disasters/${disasterId}/official-updates`, { params });
      console.log('✅ Official updates response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Official updates error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        fallback: true
      };
    }
  },
  
  getSources: async () => {
    try {
      console.log('🔍 Fetching available sources');
      const response = await api.get('/official-updates/sources');
      console.log('✅ Sources response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Sources error:', error);
      
      const mockSources = {
        available_sources: [
          {
            id: 'fema',
            name: 'FEMA',
            description: 'Federal Emergency Management Agency',
            url: 'https://fema.gov',
            categories: ['shelter', 'official', 'federal'],
            active: true
          },
          {
            id: 'redcross',
            name: 'Red Cross',
            description: 'American Red Cross',
            url: 'https://redcross.org',
            categories: ['volunteer', 'shelter', 'supplies'],
            active: true
          },
          {
            id: 'nyc',
            name: 'NYC Emergency Management',
            description: 'New York City Emergency Management',
            url: 'https://nyc.gov/emergency',
            categories: ['local', 'supplies', 'official'],
            active: true
          },
          {
            id: 'weather',
            name: 'National Weather Service',
            description: 'National Weather Service Alerts',
            url: 'https://weather.gov',
            categories: ['weather', 'alerts', 'federal'],
            active: true
          }
        ]
      };
      
      return { 
        success: true, 
        data: mockSources,
        fallback: true
      };
    }
  },
  
  getByCategory: async (category, params = {}) => {
    try {
      console.log('🔍 Fetching updates by category:', category);
      const response = await api.get(`/official-updates/category/${category}`, { params });
      console.log('✅ Category updates response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Category updates error:', error);
      
      const mockCategoryUpdates = {
        category,
        total_updates: 3,
        updates: [
          {
            id: '1',
            source: 'FEMA',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Alert - Emergency Response Active`,
            content: `Important ${category} information from FEMA. Emergency response teams are actively working on ${category}-related issues in the affected areas.`,
            url: 'https://fema.gov/disaster-updates',
            published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: 'high',
            category: category,
            contact: '1-800-621-3362'
          },
          {
            id: '2',
            source: 'Red Cross',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Support Services Available`,
            content: `Red Cross is providing ${category} support services. Multiple locations are now open to assist those in need.`,
            url: 'https://redcross.org/volunteer',
            published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            severity: 'medium',
            category: category,
            contact: '1-800-733-2767'
          },
          {
            id: '3',
            source: 'NYC Emergency Management',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Updates for NYC Residents`,
            content: `Latest ${category} information for New York City residents. Please check our website for the most current updates.`,
            url: 'https://nyc.gov/emergency',
            published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            severity: 'medium',
            category: category,
            contact: '311'
          }
        ]
      };
      
      return { 
        success: true, 
        data: mockCategoryUpdates,
        fallback: true
      };
    }
  },
  
  search: async (params = {}) => {
    try {
      console.log('🔍 Searching official updates with params:', params);
      const response = await api.get('/official-updates/search', { params });
      console.log('✅ Search updates response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Search updates error:', error);
      
      const mockSearchResults = {
        search_query: params.q || 'all',
        total_results: 5,
        results: [
          {
            id: '1',
            source: 'FEMA',
            title: 'Emergency Shelter Locations Updated',
            content: 'New emergency shelters have been opened in Manhattan and Brooklyn. Capacity for 500+ people available. All shelters are equipped with basic necessities and medical support.',
            url: 'https://fema.gov/disaster-updates',
            published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            severity: 'high',
            category: 'shelter',
            contact: '1-800-621-3362'
          },
          {
            id: '2',
            source: 'NYC Emergency Management',
            title: 'Water Distribution Points Active',
            content: 'Water distribution is now active at Central Park and Prospect Park locations from 8 AM to 6 PM. Free bottled water and emergency supplies available.',
            url: 'https://nyc.gov/emergency',
            published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: 'medium',
            category: 'supplies',
            contact: '311'
          },
          {
            id: '3',
            source: 'Red Cross',
            title: 'Volunteer Registration Open',
            content: 'Red Cross is accepting volunteer registrations for disaster relief efforts. Training provided for all volunteers. Multiple shifts available.',
            url: 'https://redcross.org/volunteer',
            published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            severity: 'low',
            category: 'volunteer',
            contact: '1-800-733-2767'
          },
          {
            id: '4',
            source: 'National Weather Service',
            title: 'Severe Weather Alert Extended',
            content: 'Severe weather conditions expected to continue through tomorrow evening. Stay indoors and avoid unnecessary travel.',
            url: 'https://weather.gov/alerts',
            published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            severity: 'high',
            category: 'weather',
            contact: 'weather.gov'
          },
          {
            id: '5',
            source: 'Salvation Army',
            title: 'Mobile Food Units Deployed',
            content: 'Mobile food units are serving hot meals in affected areas. Check locations on our website. Meals available 24/7.',
            url: 'https://salvationarmy.org/disaster-relief',
            published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            severity: 'medium',
            category: 'food',
            contact: '1-800-725-2769'
          }
        ]
      };
      
      return { 
        success: true, 
        data: mockSearchResults,
        fallback: true
      };
    }
  }
};

export const useApi = () => ({
  socialMedia: socialMediaApi,
  officialUpdates: officialUpdatesApi,
  disasters: {
    getAll: async (params = {}) => {
      try {
        const response = await api.get('/disasters', { params });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    getById: async (id) => {
      try {
        const response = await api.get(`/disasters/${id}`);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    create: async (data) => {
      try {
        const response = await api.post('/disasters', data);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    update: async (id, data) => {
      try {
        const response = await api.put(`/disasters/${id}`, data);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    delete: async (id) => {
      try {
        const response = await api.delete(`/disasters/${id}`);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },
  
  resources: {
    getNearby: async (disasterId, params = {}) => {
      try {
        const response = await api.get(`/disasters/${disasterId}/resources`, { params });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    create: async (disasterId, data) => {
      try {
        const response = await api.post(`/disasters/${disasterId}/resources`, data);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },
  
  geocoding: {
    geocode: async (data) => {
      try {
        const response = await api.post('/geocode', data);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },
  
  verification: {
    verifyImage: async (disasterId, data) => {
      try {
        const response = await api.post(`/disasters/${disasterId}/verify-image`, data);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
});

export default api;