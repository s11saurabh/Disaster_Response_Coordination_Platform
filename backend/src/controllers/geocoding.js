const { extractLocationFromDescription } = require('../services/gemini');
const { geocodeLocation } = require('../services/maps');
const logger = require('../utils/logger');

const geocodeLocationController = async (req, res) => {
  try {
    const { location_name, description } = req.body;

    if (!location_name && !description) {
      return res.status(400).json({ 
        error: 'Either location_name or description is required' 
      });
    }

    let finalLocationName = location_name;


    if (!location_name && description) {
      try {
        finalLocationName = await extractLocationFromDescription(description);
        if (!finalLocationName) {
          return res.status(400).json({ 
            error: 'Could not extract location from description' 
          });
        }
      } catch (error) {
        logger.error('Error extracting location from description:', error);
        return res.status(500).json({ 
          error: 'Failed to extract location from description' 
        });
      }
    }

   
    try {
      const coordinates = await geocodeLocation(finalLocationName);
      
      res.json({
        location_name: finalLocationName,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        extracted_from_description: !location_name
      });
    } catch (error) {
      logger.error('Error geocoding location:', error);
      res.status(500).json({ 
        error: 'Failed to geocode location',
        location_name: finalLocationName 
      });
    }
  } catch (error) {
    logger.error('Error in geocodeLocationController:', error);
    res.status(500).json({ error: 'Failed to process geocoding request' });
  }
};

module.exports = {
  geocodeLocation: geocodeLocationController
};