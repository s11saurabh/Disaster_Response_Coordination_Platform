const logger = require('../utils/logger');

const mockUsers = {
  'netrunnerX': {
    id: 'netrunnerX',
    username: 'netrunnerX',
    role: 'admin',
    permissions: ['create', 'read', 'update', 'delete', 'verify']
  },
  'reliefAdmin': {
    id: 'reliefAdmin',
    username: 'reliefAdmin',
    role: 'admin',
    permissions: ['create', 'read', 'update', 'delete', 'verify']
  },
  'contributor1': {
    id: 'contributor1',
    username: 'contributor1',
    role: 'contributor',
    permissions: ['create', 'read', 'update']
  },
  'citizen1': {
    id: 'citizen1',
    username: 'citizen1',
    role: 'citizen',
    permissions: ['create', 'read']
  }
};

const auth = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.user_id || 'netrunnerX';
    const user = mockUsers[userId];
    
    if (!user) {
      logger.warn(`Authentication failed for user: ${userId}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.user = user;
    
    logger.debug(`User authenticated: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = requiredPermissions.every(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn(`Authorization failed for user ${req.user.username}: missing permissions ${requiredPermissions}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  auth,
  authorize,
  isAdmin,
  mockUsers
};
