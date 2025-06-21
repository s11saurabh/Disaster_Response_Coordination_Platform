const { fetchOfficialUpdates, filterOfficialUpdates, searchOfficialUpdates } = require('../services/browse');
const { getCachedData, setCachedData } = require('../middleware/cache');
const logger = require('../utils/logger');

const getOfficialUpdates = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { 
      sources = 'all', 
      category, 
      severity, 
      keywords, 
      limit = 50 
    } = req.query;

    const cacheKey = `official_updates_${disaster_id}_${sources}_${category || 'all'}_${severity || 'all'}_${keywords || 'none'}`;
    
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info(`Official updates served from cache for disaster ${disaster_id}`);
      return res.json(cachedData);
    }

    const sourceArray = sources === 'all' ? ['all'] : sources.split(',').map(s => s.trim());
    
    let officialUpdates = await fetchOfficialUpdates(sourceArray);
    
    if (category) {
      officialUpdates = filterOfficialUpdates(officialUpdates, category);
    }
    
    if (severity) {
      officialUpdates = filterOfficialUpdates(officialUpdates, null, severity);
    }
    
    if (keywords) {
      officialUpdates = searchOfficialUpdates(officialUpdates, keywords);
    }
    
    if (limit && limit > 0) {
      officialUpdates = officialUpdates.slice(0, parseInt(limit));
    }
    
    const response = {
      disaster_id,
      total_updates: officialUpdates.length,
      sources_checked: sourceArray,
      filters_applied: {
        category: category || null,
        severity: severity || null,
        keywords: keywords || null
      },
      last_updated: new Date().toISOString(),
      updates: officialUpdates
    };
    
    await setCachedData(cacheKey, response);

    logger.info(`Official updates fetched for disaster ${disaster_id}: ${officialUpdates.length} updates`);
    res.json(response);
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch official updates',
      message: error.message 
    });
  }
};

const getAvailableSources = async (req, res) => {
  try {
    const sources = [
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
    ];
    
    res.json({
      available_sources: sources,
      total_sources: sources.length
    });
  } catch (error) {
    logger.error('Error getting available sources:', error);
    res.status(500).json({ 
      error: 'Failed to get available sources',
      message: error.message 
    });
  }
};

const getUpdatesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { sources = 'all', limit = 20 } = req.query;
    
    const cacheKey = `updates_by_category_${category}_${sources}`;
    
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const sourceArray = sources === 'all' ? ['all'] : sources.split(',').map(s => s.trim());
    
    let allUpdates = await fetchOfficialUpdates(sourceArray);
    
    const categoryUpdates = filterOfficialUpdates(allUpdates, category);
    
    const limitedUpdates = limit ? categoryUpdates.slice(0, parseInt(limit)) : categoryUpdates;
    
    const response = {
      category,
      total_updates: limitedUpdates.length,
      sources_checked: sourceArray,
      last_updated: new Date().toISOString(),
      updates: limitedUpdates
    };
    
    await setCachedData(cacheKey, response);
    
    logger.info(`Category updates fetched for ${category}: ${limitedUpdates.length} updates`);
    res.json(response);
  } catch (error) {
    logger.error(`Error fetching updates for category ${req.params.category}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch category updates',
      message: error.message 
    });
  }
};

const searchAllUpdates = async (req, res) => {
  try {
    const { q: query, sources = 'all', limit = 30 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const cacheKey = `search_updates_${query}_${sources}`;
    
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const sourceArray = sources === 'all' ? ['all'] : sources.split(',').map(s => s.trim());
    
    const allUpdates = await fetchOfficialUpdates(sourceArray);
    
    const searchResults = searchOfficialUpdates(allUpdates, query);
    
    const limitedResults = limit ? searchResults.slice(0, parseInt(limit)) : searchResults;
    
    const response = {
      search_query: query,
      total_results: limitedResults.length,
      sources_checked: sourceArray,
      last_updated: new Date().toISOString(),
      results: limitedResults
    };
    
    await setCachedData(cacheKey, response);
    
    logger.info(`Search completed for query "${query}": ${limitedResults.length} results`);
    res.json(response);
  } catch (error) {
    logger.error(`Error searching updates for query "${req.query.q}":`, error);
    res.status(500).json({ 
      error: 'Failed to search updates',
      message: error.message 
    });
  }
};

module.exports = {
  getOfficialUpdates,
  getAvailableSources,
  getUpdatesByCategory,
  searchAllUpdates
};
