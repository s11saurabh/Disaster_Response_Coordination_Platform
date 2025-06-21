const axios = require('axios');
const { getCachedData, setCachedData } = require('../middleware/cache');
const logger = require('../utils/logger');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

const geocodeLocation = async (locationName) => {
  try {
    const cacheKey = `geocode_${Buffer.from(locationName.toLowerCase()).toString('base64')}`;
    
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      logger.debug(`Geocoding cache hit for: ${locationName}`);
      return cachedResult;
    }

    let coordinates = null;

    if (GOOGLE_MAPS_API_KEY) {
      try {
        coordinates = await geocodeWithGoogleMaps(locationName);
      } catch (error) {
        logger.warn('Google Maps geocoding failed:', error.message);
      }
    }

    if (!coordinates && MAPBOX_ACCESS_TOKEN) {
      try {
        coordinates = await geocodeWithMapbox(locationName);
      } catch (error) {
        logger.warn('Mapbox geocoding failed:', error.message);
      }
    }

    if (!coordinates) {
      try {
        coordinates = await geocodeWithNominatim(locationName);
      } catch (error) {
        logger.warn('Nominatim geocoding failed:', error.message);
      }
    }

    if (!coordinates) {
      throw new Error('All geocoding services failed');
    }

    await setCachedData(cacheKey, coordinates, 7 * 24 * 60 * 60 * 1000);

    logger.info(`Geocoded "${locationName}" to ${coordinates.lat}, ${coordinates.lng}`);
    return coordinates;
  } catch (error) {
    logger.error(`Error geocoding location "${locationName}":`, error.message);
    throw error;
  }
};

const geocodeWithGoogleMaps = async (locationName) => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const params = {
    address: locationName,
    key: GOOGLE_MAPS_API_KEY
  };

  const response = await axios.get(url, { 
    params,
    timeout: 5000
  });

  if (response.data.status !== 'OK' || !response.data.results.length) {
    throw new Error(`Google Maps API error: ${response.data.status}`);
  }

  const location = response.data.results[0].geometry.location;
  return {
    lat: location.lat,
    lng: location.lng,
    formatted_address: response.data.results[0].formatted_address,
    source: 'google_maps'
  };
};

const geocodeWithMapbox = async (locationName) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json`;
  const params = {
    access_token: MAPBOX_ACCESS_TOKEN,
    limit: 1
  };

  const response = await axios.get(url, { 
    params,
    timeout: 5000
  });

  if (!response.data.features || !response.data.features.length) {
    throw new Error('No results from Mapbox');
  }

  const feature = response.data.features[0];
  const [lng, lat] = feature.center;

  return {
    lat,
    lng,
    formatted_address: feature.place_name,
    source: 'mapbox'
  };
};

const geocodeWithNominatim = async (locationName) => {
  const url = 'https://nominatim.openstreetmap.org/search';
  const params = {
    q: locationName,
    format: 'json',
    limit: 1,
    'accept-language': 'en'
  };

  const response = await axios.get(url, { 
    params,
    headers: {
      'User-Agent': 'DisasterResponsePlatform/1.0'
    },
    timeout: 5000
  });

  if (!response.data || !response.data.length) {
    throw new Error('No results from Nominatim');
  }

  const result = response.data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formatted_address: result.display_name,
    source: 'nominatim'
  };
};

const reverseGeocode = async (lat, lng) => {
  try {
    const cacheKey = `reverse_geocode_${lat}_${lng}`;
    
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let address = null;

    if (GOOGLE_MAPS_API_KEY) {
      try {
        address = await reverseGeocodeWithGoogleMaps(lat, lng);
      } catch (error) {
        logger.warn('Google Maps reverse geocoding failed:', error.message);
      }
    }

    if (!address) {
      try {
        address = await reverseGeocodeWithNominatim(lat, lng);
      } catch (error) {
        logger.warn('Nominatim reverse geocoding failed:', error.message);
      }
    }

    if (!address) {
      throw new Error('All reverse geocoding services failed');
    }

    await setCachedData(cacheKey, address, 7 * 24 * 60 * 60 * 1000);

    return address;
  } catch (error) {
    logger.error(`Error reverse geocoding ${lat}, ${lng}:`, error.message);
    throw error;
  }
};

const reverseGeocodeWithGoogleMaps = async (lat, lng) => {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const params = {
    latlng: `${lat},${lng}`,
    key: GOOGLE_MAPS_API_KEY
  };

  const response = await axios.get(url, { 
    params,
    timeout: 5000
  });

  if (response.data.status !== 'OK' || !response.data.results.length) {
    throw new Error(`Google Maps API error: ${response.data.status}`);
  }

  return {
    formatted_address: response.data.results[0].formatted_address,
    components: response.data.results[0].address_components,
    source: 'google_maps'
  };
};

const reverseGeocodeWithNominatim = async (lat, lng) => {
  const url = 'https://nominatim.openstreetmap.org/reverse';
  const params = {
    lat,
    lon: lng,
    format: 'json',
    'accept-language': 'en'
  };

  const response = await axios.get(url, { 
    params,
    headers: {
      'User-Agent': 'DisasterResponsePlatform/1.0'
    },
    timeout: 5000
  });

  if (!response.data) {
    throw new Error('No results from Nominatim');
  }

  return {
    formatted_address: response.data.display_name,
    components: response.data.address,
    source: 'nominatim'
  };
};

module.exports = {
  geocodeLocation,
  reverseGeocode
};
