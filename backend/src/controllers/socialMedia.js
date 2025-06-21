const axios = require('axios');
const cheerio = require('cheerio');
const { getCachedData, setCachedData } = require('../middleware/cache');
const { fetchSocialMediaData } = require('../services/socialMedia');
const logger = require('../utils/logger');

const mockSocialMediaData = [
  {
    id: '1',
    post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
    user: 'citizen_helper1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    verified: false
  },
  {
    id: '2',
    post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
    user: 'brooklyn_resident',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    verified: false
  },
  {
    id: '3',
    post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
    user: 'medical_volunteer',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false
  }
];

const getSocialMediaReports = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { keywords, limit = 20, disaster_type } = req.query;

    const cacheKey = `social_media_${disaster_id}_${keywords || 'all'}_${disaster_type || 'general'}`;
    
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const socialMediaData = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit));

    await setCachedData(cacheKey, socialMediaData);

    req.io.emit('social_media_updated', { disaster_id, data: socialMediaData });

    logger.info(`Social media reports fetched for disaster ${disaster_id}: ${socialMediaData.length} posts`);
    res.json({
      disaster_id,
      total_posts: socialMediaData.length,
      keywords_used: keywords,
      disaster_type: disaster_type,
      last_updated: new Date().toISOString(),
      posts: socialMediaData
    });
  } catch (error) {
    logger.error('Error fetching social media reports:', error);
    res.status(500).json({ error: 'Failed to fetch social media reports' });
  }
};

const getMockSocialMedia = async (req, res) => {
  try {
    const { keywords, limit = 20, disaster_type } = req.query;

    const mockData = await fetchSocialMediaData(keywords, disaster_type, parseInt(limit));

    logger.info(`Mock social media data requested: ${mockData.length} posts`);
    res.json({
      message: 'Mock social media data',
      total_posts: mockData.length,
      keywords_used: keywords,
      disaster_type: disaster_type,
      timestamp: new Date().toISOString(),
      posts: mockData
    });
  } catch (error) {
    logger.error('Error fetching mock social media data:', error);
    res.status(500).json({ error: 'Failed to fetch mock social media data' });
  }
};

const getOfficialUpdates = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const cacheKey = `official_updates_${disaster_id}`;

    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const officialUpdates = await fetchOfficialUpdates();
    
    await setCachedData(cacheKey, officialUpdates);

    logger.info(`Official updates fetched for disaster ${disaster_id}`);
    res.json(officialUpdates);
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
};

const fetchMockSocialMediaData = async (keywords) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (keywords) {
    const keywordArray = keywords.toLowerCase().split(',');
    return mockSocialMediaData.filter(post => 
      keywordArray.some(keyword => 
        post.post.toLowerCase().includes(keyword.trim())
      )
    );
  }
  
  return mockSocialMediaData;
};

const processSocialMediaData = (data, keywords) => {
  return data.map(post => {
    let priority = 'low';
    const postText = post.post.toLowerCase();
    
    if (postText.includes('urgent') || postText.includes('sos') || postText.includes('emergency')) {
      priority = 'urgent';
    } else if (postText.includes('need') || postText.includes('help') || postText.includes('stranded')) {
      priority = 'high';
    } else if (postText.includes('offering') || postText.includes('volunteer')) {
      priority = 'medium';
    }

    return {
      ...post,
      priority,
      processed_at: new Date().toISOString()
    };
  }).sort((a, b) => {
    const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

const fetchOfficialUpdates = async () => {
  try {
    const mockOfficialUpdates = [
      {
        id: '1',
        source: 'FEMA',
        title: 'Emergency Shelter Locations Updated',
        content: 'New emergency shelters have been opened in Manhattan and Brooklyn. See locations below.',
        url: 'https://fema.gov/disaster-updates',
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        severity: 'high'
      },
      {
        id: '2',
        source: 'NYC Emergency Management',
        title: 'Water Distribution Points Active',
        content: 'Water distribution is now active at Central Park and Prospect Park locations.',
        url: 'https://nyc.gov/emergency',
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: 'medium'
      },
      {
        id: '3',
        source: 'Red Cross',
        title: 'Volunteer Registration Open',
        content: 'Red Cross is accepting volunteer registrations for disaster relief efforts.',
        url: 'https://redcross.org/volunteer',
        published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        severity: 'low'
      }
    ];

    return mockOfficialUpdates;
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    throw error;
  }
};

module.exports = {
  getSocialMediaReports,
  getMockSocialMedia,
  getOfficialUpdates
};
