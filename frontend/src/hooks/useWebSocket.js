import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(WEBSOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: maxReconnectAttempts,
        timeout: 20000,
        forceNew: true
      });

      window.socket = socketRef.current;

      socketRef.current.on('connect', () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log('✅ WebSocket connected:', socketRef.current.id);
        }
      });

      socketRef.current.on('connect_error', (err) => {
        setConnected(false);
        setError(err.message);
        
        console.error('❌ WebSocket connection error:', err);
        
        reconnectAttemptsRef.current += 1;
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast.error('Failed to connect to real-time services');
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        setConnected(false);
        
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log('🔌 WebSocket disconnected:', reason);
        }

        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, 2000);
          }
        }
      });

      socketRef.current.on('reconnect_attempt', (attempt) => {
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log(`🔄 Reconnection attempt ${attempt}`);
        }
      });

      socketRef.current.on('reconnect', (attempt) => {
        setConnected(true);
        setError(null);
        toast.success('Reconnected to real-time services');
        
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log(`✅ Reconnected after ${attempt} attempts`);
        }
      });

      socketRef.current.on('reconnect_failed', () => {
        setConnected(false);
        toast.error('Unable to reconnect to real-time services');
        console.error('❌ Failed to reconnect after maximum attempts');
      });

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      window.socket = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setConnected(false);
    setError(null);
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
      
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`📤 Emitted ${event}:`, data);
      }
      
      return true;
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }
  }, [connected]);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`👂 Listening for ${event}`);
      }
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
      
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`🔇 Stopped listening for ${event}`);
      }
    }
  }, []);

  const joinRoom = useCallback((room) => {
    if (emit('join_room', room)) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`🏠 Joined room: ${room}`);
      }
    }
  }, [emit]);

  const leaveRoom = useCallback((room) => {
    if (emit('leave_room', room)) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`🚪 Left room: ${room}`);
      }
    }
  }, [emit]);

  const joinDisaster = useCallback((disasterId) => {
    if (emit('join_disaster', disasterId)) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`🌪️ Joined disaster room: ${disasterId}`);
      }
    }
  }, [emit]);

  const leaveDisaster = useCallback((disasterId) => {
    if (emit('leave_disaster', disasterId)) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`🌪️ Left disaster room: ${disasterId}`);
      }
    }
  }, [emit]);

  const joinLocation = useCallback((lat, lng, radius = 10) => {
    const locationData = { lat, lng, radius };
    if (emit('join_location', locationData)) {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log(`📍 Joined location room: ${lat}, ${lng} (${radius}km)`);
      }
    }
  }, [emit]);

  const sendEmergencyAlert = useCallback((message, location, priority = 'urgent') => {
    const alertData = { message, location, priority };
    if (emit('emergency_alert', alertData)) {
      toast.success('Emergency alert sent');
      return true;
    } else {
      toast.error('Failed to send emergency alert');
      return false;
    }
  }, [emit]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log('🙈 Page hidden, maintaining connection');
        }
      } else {
        if (!connected && socketRef.current?.disconnected) {
          connect();
        }
        
        if (process.env.REACT_APP_DEBUG_MODE === 'true') {
          console.log('👀 Page visible, checking connection');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connected, connect]);

  useEffect(() => {
    const handleOnline = () => {
      if (!connected) {
        connect();
      }
      toast.success('Back online');
    };

    const handleOffline = () => {
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connected, connect]);

  return {
    connected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    joinDisaster,
    leaveDisaster,
    joinLocation,
    sendEmergencyAlert,
    socket: socketRef.current
  };
};
