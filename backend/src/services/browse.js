const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const mockOfficialUpdates = [
  {
    id: '1',
    source: 'FEMA',
    title: 'Emergency Shelter Locations Updated',
    content: 'New emergency shelters have been opened in Manhattan and Brooklyn. Capacity for 500+ people available.',
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
    content: 'Water distribution is now active at Central Park and Prospect Park locations from 8 AM to 6 PM.',
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
    content: 'Red Cross is accepting volunteer registrations for disaster relief efforts. Training provided.',
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
    content: 'Severe weather conditions expected to continue through tomorrow evening. Stay indoors.',
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
    content: 'Mobile food units are serving hot meals in affected areas. Check locations on our website.',
    url: 'https://salvationarmy.org/disaster-relief',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    severity: 'medium',
    category: 'food',
    contact: '1-800-725-2769'
  }
];

const scrapeFEMAUpdates = async () => {
  try {
    logger.warn('FEMA scraping not implemented, using mock data');
    return mockOfficialUpdates.filter(update => update.source === 'FEMA');
  } catch (error) {
    logger.error('Error scraping FEMA updates:', error);
    return mockOfficialUpdates.filter(update => update.source === 'FEMA');
  }
};

const scrapeRedCrossUpdates = async () => {
  try {
    logger.warn('Red Cross scraping not implemented, using mock data');
    return mockOfficialUpdates.filter(update => update.source === 'Red Cross');
  } catch (error) {
    logger.error('Error scraping Red Cross updates:', error);
    return mockOfficialUpdates.filter(update => update.source === 'Red Cross');
  }
};

const scrapeNYCEmergencyUpdates = async () => {
  try {
    logger.warn('NYC Emergency scraping not implemented, using mock data');
    return mockOfficialUpdates.filter(update => update.source === 'NYC Emergency Management');
  } catch (error) {
    logger.error('Error scraping NYC Emergency updates:', error);
    return mockOfficialUpdates.filter(update => update.source === 'NYC Emergency Management');
  }
};

const scrapeWeatherServiceUpdates = async () => {
  try {
    logger.warn('Weather Service scraping not implemented, using mock data');
    return mockOfficialUpdates.filter(update => update.source === 'National Weather Service');
  } catch (error) {
    logger.error('Error scraping Weather Service updates:', error);
    return mockOfficialUpdates.filter(update => update.source === 'National Weather Service');
  }
};

const scrapeGenericSite = async (url, selectors) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DisasterResponseBot/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const updates = [];
    
    $(selectors.container).each((index, element) => {
      const title = $(element).find(selectors.title).text().trim();
      const content = $(element).find(selectors.content).text().trim();
      const link = $(element).find(selectors.link).attr('href');
      const date = $(element).find(selectors.date).text().trim();
      
      if (title && content) {
        updates.push({
          id: `generic_${Date.now()}_${index}`,
          source: new URL(url).hostname,
          title,
          content: content.substring(0, 500),
          url: link ? (link.startsWith('http') ? link : `${new URL(url).origin}${link}`) : url,
          published_at: date ? new Date(date).toISOString() : new Date().toISOString(),
          severity: 'medium',
          category: 'official'
        });
      }
    });
    
    return updates;
  } catch (error) {
    logger.error(`Error scraping ${url}:`, error);
    return [];
  }
};

const fetchOfficialUpdates = async (sources = ['all']) => {
  try {
    const allUpdates = [];
    
    const shouldScrapeAll = sources.includes('all');
    
    if (shouldScrapeAll || sources.includes('fema')) {
      const femaUpdates = await scrapeFEMAUpdates();
      allUpdates.push(...femaUpdates);
    }
    
    if (shouldScrapeAll || sources.includes('redcross')) {
      const redCrossUpdates = await scrapeRedCrossUpdates();
      allUpdates.push(...redCrossUpdates);
    }
    
    if (shouldScrapeAll || sources.includes('nyc')) {
      const nycUpdates = await scrapeNYCEmergencyUpdates();
      allUpdates.push(...nycUpdates);
    }
    
    if (shouldScrapeAll || sources.includes('weather')) {
      const weatherUpdates = await scrapeWeatherServiceUpdates();
      allUpdates.push(...weatherUpdates);
    }
    
    if (allUpdates.length === 0) {
      logger.info('No official updates scraped, using mock data');
      return mockOfficialUpdates;
    }
    
    const sortedUpdates = allUpdates.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.published_at) - new Date(a.published_at);
    });
    
    logger.info(`Fetched ${sortedUpdates.length} official updates`);
    return sortedUpdates;
  } catch (error) {
    logger.error('Error fetching official updates:', error);
    return mockOfficialUpdates;
  }
};

const filterOfficialUpdates = (updates, category = null, severity = null) => {
  let filtered = [...updates];
  
  if (category) {
    filtered = filtered.filter(update => 
      update.category && update.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (severity) {
    filtered = filtered.filter(update => 
      update.severity && update.severity.toLowerCase() === severity.toLowerCase()
    );
  }
  
  return filtered;
};

const searchOfficialUpdates = (updates, keywords) => {
  if (!keywords) return updates;
  
  const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
  
  return updates.filter(update => {
    const searchText = `${update.title} ${update.content}`.toLowerCase();
    return keywordArray.some(keyword => searchText.includes(keyword));
  });
};

module.exports = {
  fetchOfficialUpdates,
  filterOfficialUpdates,
  searchOfficialUpdates,
  scrapeFEMAUpdates,
  scrapeRedCrossUpdates,
  scrapeNYCEmergencyUpdates,
  scrapeWeatherServiceUpdates,
  scrapeGenericSite
};
