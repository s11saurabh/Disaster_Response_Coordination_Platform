import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  Layers, 
  Search, 
  Filter,
  Navigation,
  AlertTriangle,
  Shield,
  MapPin,
  Plus,
  RefreshCw,
  Target,
  Info,
  User
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const createCustomIcon = (color, icon, size = 40) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        font-size: 16px;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg); 
          color: white; 
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ">
          ${icon}
        </div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
  });
};


const disasterIcon = createCustomIcon('#dc2626', '🚨', 45);
const shelterIcon = createCustomIcon('#10b981', '🏠', 35);
const medicalIcon = createCustomIcon('#3b82f6', '🏥', 35);
const foodIcon = createCustomIcon('#f59e0b', '🍽️', 35);
const waterIcon = createCustomIcon('#06b6d4', '💧', 35);
const userLocationIcon = createCustomIcon('#8b5cf6', '📍', 30);

const MapController = ({ center, zoom, onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
    onMapReady && onMapReady(map);
  }, [center, zoom, map, onMapReady]);

  return null;
};

const ResourceMap = ({ disasters, selectedDisaster, onDisasterSelect }) => {
  const { resources } = useApi();
  const [mapResources, setMapResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(['disasters', 'shelters', 'medical', 'food', 'water']);
  const [mapCenter, setMapCenter] = useState([
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT) || 40.7128,
    parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG) || -74.0060
  ]);
  const [mapZoom, setMapZoom] = useState(parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 12);
  const [searchRadius, setSearchRadius] = useState(10000); 
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  
  useEffect(() => {
    loadResourcesFromBackend();
  }, [disasters, mapCenter, searchRadius]);

  useEffect(() => {
    if (selectedDisaster) {
      const coords = parseLocationCoordinates(selectedDisaster.location);
      if (coords) {
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(14);
      } else if (selectedDisaster.location_name) {
       
        geocodeLocationName(selectedDisaster.location_name);
      }
    }
  }, [selectedDisaster]);

  const parseLocationCoordinates = (location) => {
    if (typeof location === 'string') {
     
      const match = location.match(/POINT\(([^)]+)\)/);
      if (match) {
        const [lng, lat] = match[1].split(' ').map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    return null;
  };

  const geocodeLocationName = async (locationName) => {
    try {
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'DisasterResponsePlatform/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setMapZoom(13);
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  const loadResourcesFromBackend = async () => {
    setLoading(true);
    try {
      
      const response = await resources.getAll();
      if (response.success && response.data) {
        setMapResources(response.data);
      } else {
       
        setMapResources([]);
      }
    } catch (error) {
      console.error('Failed to load resources from backend:', error);
      
      setMapResources([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
          setLoading(false);
          toast.success('Location updated to your current position');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
          toast.error('Could not get your location. Please enable location services.');
        }
      );
    } else {
      setLoading(false);
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      
      const filteredDisasters = disasters.filter(disaster =>
        disaster.title?.toLowerCase().includes(query.toLowerCase()) ||
        disaster.location_name?.toLowerCase().includes(query.toLowerCase()) ||
        disaster.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (filteredDisasters.length > 0) {
        const firstResult = filteredDisasters[0];
        const coords = parseLocationCoordinates(firstResult.location);
        if (coords) {
          setMapCenter([coords.lat, coords.lng]);
          setMapZoom(14);
          onDisasterSelect(firstResult);
        }
      }
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'disaster':
        return disasterIcon;
      case 'shelter':
        return shelterIcon;
      case 'medical':
        return medicalIcon;
      case 'food':
        return foodIcon;
      case 'water':
        return waterIcon;
      default:
        return disasterIcon;
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'shelter':
        return '#10b981';
      case 'medical':
        return '#3b82f6';
      case 'food':
        return '#f59e0b';
      case 'water':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  
  const filteredDisasters = disasters.filter(disaster => {
    const matchesSearch = !searchQuery || 
      disaster.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disaster.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disaster.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilters.includes('disasters');
    
    return matchesSearch && matchesFilter;
  });

  const filteredResources = mapResources.filter(resource => {
    const matchesSearch = !searchQuery || 
      resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilters.includes(resource.type);
    
    return matchesSearch && matchesFilter;
  });

  
  const resourceCounts = {
    disasters: disasters?.length || 0,
    shelters: mapResources.filter(r => r.type === 'shelter')?.length || 0,
    medical: mapResources.filter(r => r.type === 'medical')?.length || 0,
    food: mapResources.filter(r => r.type === 'food')?.length || 0,
    water: mapResources.filter(r => r.type === 'water')?.length || 0
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
     
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Map</h1>
          <p className="text-gray-600 mt-1">
            View disasters and resources on the interactive map
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => loadResourcesFromBackend()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Target className="w-4 h-4" />
            <span>My Location</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
       
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
        
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Search</h3>
            </div>
            
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Show on Map</h3>
            </div>
            
            <div className="space-y-2">
              {[
                { id: 'disasters', label: 'Disasters', color: '#ef4444', count: resourceCounts.disasters },
                { id: 'shelters', label: 'Shelters', color: '#10b981', count: resourceCounts.shelters },
                { id: 'medical', label: 'Medical Aid', color: '#3b82f6', count: resourceCounts.medical },
                { id: 'food', label: 'Food Centers', color: '#f59e0b', count: resourceCounts.food },
                { id: 'water', label: 'Water Points', color: '#06b6d4', count: resourceCounts.water }
              ].map((filter) => (
                <label key={filter.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(filter.id)}
                    onChange={() => handleFilterToggle(filter.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: filter.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{filter.label}</span>
                    {filter.count > 0 && (
                      <span className="text-xs text-gray-500">({filter.count})</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Map Legend</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🚨</span>
                <span>Active Disasters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏠</span>
                <span>Emergency Shelters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏥</span>
                <span>Medical Centers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🍽️</span>
                <span>Food Distribution</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">💧</span>
                <span>Water Points</span>
              </div>
            </div>
          </div>
        </motion.div>

      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-[600px] relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="rounded-xl"
              >
                <MapController 
                  center={mapCenter} 
                  zoom={mapZoom}
                  onMapReady={setMapInstance}
                />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

               
                <Circle
                  center={mapCenter}
                  radius={searchRadius}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />

               
                {userLocation && (
                  <Marker position={userLocation} icon={userLocationIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>Your Location</strong>
                      </div>
                    </Popup>
                  </Marker>
                )}

               
                {filteredDisasters.map((disaster) => {
                  const coords = parseLocationCoordinates(disaster.location);
                  
                  const markerPosition = coords 
                    ? [coords.lat, coords.lng]
                    : [mapCenter[0] + (Math.random() - 0.5) * 0.02, mapCenter[1] + (Math.random() - 0.5) * 0.02];
                  
                  return (
                    <Marker
                      key={`disaster-${disaster.id}`}
                      position={markerPosition}
                      icon={disasterIcon}
                      eventHandlers={{
                        click: () => onDisasterSelect(disaster)
                      }}
                    >
                      <Popup>
                        <div className="min-w-48">
                          <h3 className="font-semibold text-red-700 mb-2">{disaster.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{disaster.description}</p>
                          
                          {disaster.location_name && (
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {disaster.location_name}
                            </div>
                          )}
                          
                          {disaster.tags && disaster.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {disaster.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <button
                            onClick={() => onDisasterSelect(disaster)}
                            className="w-full mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                
                {filteredResources.map((resource) => (
                  <Marker
                    key={`resource-${resource.id}`}
                    position={resource.coordinates}
                    icon={getMarkerIcon(resource.type)}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <h3 className="font-semibold mb-2" style={{ color: getResourceColor(resource.type) }}>
                          {resource.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {resource.location_name}
                        </div>
                        
                        {resource.distance && (
                          <div className="text-sm text-gray-500 mb-2">
                            Distance: {(resource.distance / 1000).toFixed(1)} km
                          </div>
                        )}
                        
                        {resource.contact_info && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Contact:</strong> {resource.contact_info}
                          </div>
                        )}
                        
                        <div className="flex space-x-2 mt-2">
                          <span
                            className="px-2 py-1 text-xs rounded text-white capitalize"
                            style={{ backgroundColor: getResourceColor(resource.type) }}
                          >
                            {resource.type}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

             
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
                  <div className="text-center">
                    <div className="spinner-lg mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResourceMap;