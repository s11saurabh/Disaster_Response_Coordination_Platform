import { useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(url, options);
          break;
        case 'post':
          response = await api.post(url, data, options);
          break;
        case 'put':
          response = await api.put(url, data, options);
          break;
        case 'patch':
          response = await api.patch(url, data, options);
          break;
        case 'delete':
          response = await api.delete(url, options);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      const errorStatus = err.response?.status || 500;
      
      setError({
        message: errorMessage,
        status: errorStatus,
        details: err.response?.data
      });

      // Show user-friendly error messages
      if (errorStatus === 401) {
        toast.error('Authentication required');
      } else if (errorStatus === 403) {
        toast.error('Access denied');
      } else if (errorStatus === 404) {
        toast.error('Resource not found');
      } else if (errorStatus === 429) {
        toast.error('Too many requests. Please slow down.');
      } else if (errorStatus >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (!options.suppressErrorToast) {
        toast.error(errorMessage);
      }

      console.error('API Error:', {
        method,
        url,
        status: errorStatus,
        message: errorMessage,
        details: err.response?.data
      });

      return {
        success: false,
        error: {
          message: errorMessage,
          status: errorStatus,
          details: err.response?.data
        }
      };
    } finally {
      setLoading(false);
    }
  }, []);

  
  const get = useCallback((url, options = {}) => {
    return request('get', url, null, options);
  }, [request]);

  const post = useCallback((url, data, options = {}) => {
    return request('post', url, data, options);
  }, [request]);

  const put = useCallback((url, data, options = {}) => {
    return request('put', url, data, options);
  }, [request]);

  const patch = useCallback((url, data, options = {}) => {
    return request('patch', url, data, options);
  }, [request]);

  const del = useCallback((url, options = {}) => {
    return request('delete', url, null, options);
  }, [request]);

 
  const disasters = {
    getAll: useCallback((params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/disasters?${queryString}` : '/disasters';
      return get(url);
    }, [get]),

    getById: useCallback((id) => {
      return get(`/disasters/${id}`);
    }, [get]),

    create: useCallback((data) => {
      return post('/disasters', data);
    }, [post]),

    update: useCallback((id, data) => {
      return put(`/disasters/${id}`, data);
    }, [put]),

    delete: useCallback((id) => {
      return del(`/disasters/${id}`);
    }, [del]),

    addReport: useCallback((id, reportData) => {
      return post(`/disasters/${id}/reports`, reportData);
    }, [post]),

    getReports: useCallback((id, params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/disasters/${id}/reports?${queryString}` : `/disasters/${id}/reports`;
      return get(url);
    }, [get]),

    getSocialMedia: useCallback((id, params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/disasters/${id}/social-media?${queryString}` : `/disasters/${id}/social-media`;
      return get(url);
    }, [get]),

    getOfficialUpdates: useCallback((id) => {
      return get(`/disasters/${id}/official-updates`);
    }, [get]),

    verifyImage: useCallback((id, imageData) => {
      return post(`/disasters/${id}/verify-image`, imageData);
    }, [post])
  };



  const socialMedia = {
    getReports: (disasterId, params = {}) => {
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/disasters/${disasterId}/social-media?${qs}` : `/disasters/${disasterId}/social-media`
      return get(url)
    },
    getMockData: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/mock-social-media?${qs}` : '/mock-social-media'
      return get(url)
    }
  }



  const officialUpdates = {
    getForDisaster: (disasterId, params = {}) => {
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/disasters/${disasterId}/official-updates?${qs}` : `/disasters/${disasterId}/official-updates`
      return get(url)
    },
    getSources: () => get('/official-updates/sources'),
    getByCategory: (category, params = {}) => {
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/official-updates/category/${category}?${qs}` : `/official-updates/category/${category}`
      return get(url)
    },
    search: (params = {}) => {
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `/official-updates/search?${qs}` : '/official-updates/search'
      return get(url)
    }
  }










 
  const resources = {
    getNearby: useCallback((disasterId, params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/disasters/${disasterId}/resources?${queryString}` : `/disasters/${disasterId}/resources`;
      return get(url);
    }, [get]),

    create: useCallback((disasterId, data) => {
      return post(`/disasters/${disasterId}/resources`, data);
    }, [post])
  };

 
  const geocoding = {
    geocode: useCallback((data) => {
      return post('/geocode', data);
    }, [post])
  };

 
  const uploadFile = useCallback(async (file, onProgress = null) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      };

      const response = await api.post('/upload', formData, config);

      return {
        success: true,
        data: response.data
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError({ message: errorMessage });
      toast.error(errorMessage);

      return {
        success: false,
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  }, []);





 
  const batch = useCallback(async (requests) => {
    setLoading(true);
    setError(null);

    try {
      const promises = requests.map(({ method, url, data, options }) => 
        request(method, url, data, { ...options, suppressErrorToast: true })
      );

      const results = await Promise.allSettled(promises);
      
      const responses = results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled' && result.value.success,
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : 
               (result.value.success ? null : result.value.error)
      }));

      const successCount = responses.filter(r => r.success).length;
      const failureCount = responses.length - successCount;

      if (failureCount > 0) {
        toast.error(`${failureCount} of ${responses.length} requests failed`);
      } else {
        toast.success(`All ${responses.length} requests completed successfully`);
      }

      return {
        success: failureCount === 0,
        responses,
        successCount,
        failureCount
      };
    } catch (err) {
      setError({ message: err.message });
      toast.error('Batch request failed');
      
      return {
        success: false,
        error: { message: err.message }
      };
    } finally {
      setLoading(false);
    }
  }, [request]);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    disasters,
    resources,
    geocoding,
    socialMedia,
   officialUpdates,
    uploadFile,
    batch
  };
};




