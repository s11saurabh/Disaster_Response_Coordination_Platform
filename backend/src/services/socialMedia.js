const axios = require('axios');
const logger = require('../utils/logger');

const mockSocialMediaData = [
  {
    id: '1',
    post: '#floodrelief Need food and water in Lower Manhattan. Families stranded!',
    user: 'citizen_helper1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    verified: false,
    location: 'Lower Manhattan, NYC',
    hashtags: ['#floodrelief', '#emergency']
  },
  {
    id: '2',
    post: 'Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp',
    user: 'brooklyn_resident',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    verified: false,
    location: 'Brooklyn Heights, NYC',
    hashtags: ['#disasterhelp', '#shelter']
  },
  {
    id: '3',
    post: 'URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp',
    user: 'medical_volunteer',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: '42nd Street, NYC',
    hashtags: ['#emergencyhelp', '#medical']
  },
  {
    id: '4',
    post: 'Earthquake felt in downtown area. Buildings shaking! #earthquake #help',
    user: 'downtown_witness',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: 'Downtown',
    hashtags: ['#earthquake', '#help']
  },
  {
    id: '5',
    post: 'Fire spreading near residential area. Evacuations needed! #fire #evacuate',
    user: 'safety_alert',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    priority: 'urgent',
    verified: false,
    location: 'Residential District',
    hashtags: ['#fire', '#evacuate']
  },
  {
    id: '6',
    post: 'Have extra blankets and warm clothes for disaster victims #donate #help',
    user: 'community_helper',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    verified: false,
    location: 'Community Center',
    hashtags: ['#donate', '#help']
  }
];

const fetchMockSocialMediaData = async (keywords, disasterType) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredData = [...mockSocialMediaData];
    
    if (keywords) {
      const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
      filteredData = filteredData.filter(post => 
        keywordArray.some(keyword => 
          post.post.toLowerCase().includes(keyword) ||
          post.hashtags.some(hashtag => hashtag.toLowerCase().includes(keyword))
        )
      );
    }
    
    if (disasterType) {
      const type = disasterType.toLowerCase();
      filteredData = filteredData.filter(post => 
        post.post.toLowerCase().includes(type) ||
        post.hashtags.some(hashtag => hashtag.toLowerCase().includes(type))
      );
    }
    
    logger.info(`Mock social media data fetched: ${filteredData.length} posts`);
    return filteredData;
  } catch (error) {
    logger.error('Error fetching mock social media data:', error);
    throw error;
  }
};

const processSocialMediaData = (data, keywords) => {
  const processed = data.map(post => {
    let priority = 'low';
    const postText = post.post.toLowerCase();
    
    if (postText.includes('urgent') || postText.includes('sos') || 
        postText.includes('emergency') || postText.includes('evacuate')) {
      priority = 'urgent';
    }
    else if (postText.includes('need') || postText.includes('help') || 
             postText.includes('stranded') || postText.includes('trapped')) {
      priority = 'high';
    }
    else if (postText.includes('offering') || postText.includes('volunteer') || 
             postText.includes('shelter') || postText.includes('donate')) {
      priority = 'medium';
    }

    return {
      ...post,
      priority,
      processed_at: new Date().toISOString(),
      relevance_score: calculateRelevanceScore(post, keywords)
    };
  });

  return processed.sort((a, b) => {
    const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    return b.relevance_score - a.relevance_score;
  });
};

const calculateRelevanceScore = (post, keywords) => {
  if (!keywords) return 1;
  
  let score = 0;
  const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
  const postText = post.post.toLowerCase();
  
  keywordArray.forEach(keyword => {
    if (postText.includes(keyword)) score += 3;
    
    if (post.hashtags.some(hashtag => hashtag.toLowerCase().includes(keyword))) {
      score += 2;
    }
    
    if (post.location && post.location.toLowerCase().includes(keyword)) {
      score += 1;
    }
  });
  
  return score;
};

const fetchTwitterData = async (query, count = 20) => {
  try {
    logger.warn('Twitter API not implemented, using mock data');
    return await fetchMockSocialMediaData(query);
  } catch (error) {
    logger.error('Twitter API error:', error);
    throw error;
  }
};

const fetchBlueskyData = async (query, count = 20) => {
  try {
    logger.warn('Bluesky API not implemented, using mock data');
    return await fetchMockSocialMediaData(query);
  } catch (error) {
    logger.error('Bluesky API error:', error);
    throw error;
  }
};

const fetchSocialMediaData = async (keywords, disasterType, limit = 20) => {
  try {
    let data = [];
    
    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        data = await fetchTwitterData(keywords, limit);
      } catch (error) {
        logger.warn('Twitter API failed, trying alternatives');
      }
    }
    
    if (data.length === 0 && process.env.BLUESKY_ACCESS_TOKEN) {
      try {
        data = await fetchBlueskyData(keywords, limit);
      } catch (error) {
        logger.warn('Bluesky API failed, using mock data');
      }
    }
    
    if (data.length === 0) {
      data = await fetchMockSocialMediaData(keywords, disasterType);
    }
    
    return processSocialMediaData(data, keywords);
  } catch (error) {
    logger.error('Error fetching social media data:', error);
    return processSocialMediaData(mockSocialMediaData, keywords);
  }
};

module.exports = {
  fetchSocialMediaData,
  fetchMockSocialMediaData,
  processSocialMediaData,
  calculateRelevanceScore
};
