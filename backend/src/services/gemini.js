const axios = require('axios');
const { getCachedData, setCachedData } = require('../middleware/cache');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!GEMINI_API_KEY) {
  logger.error('Missing GEMINI_API_KEY environment variable');
}

const extractLocationFromDescription = async (description) => {
  try {
    const cacheKey = `gemini_location_${Buffer.from(description).toString('base64').substring(0, 50)}`;
    
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const prompt = `Extract the specific location name from this disaster description. Return only the location name (city, neighborhood, or specific place) without any additional text or explanation. If no specific location is found, return "unknown".

Description: "${description}"

Location:`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const extractedLocation = response.data.candidates[0].content.parts[0].text.trim();
    
    if (extractedLocation.toLowerCase() === 'unknown' || 
        extractedLocation.toLowerCase().includes('no location') ||
        extractedLocation.length < 2) {
      return null;
    }

    await setCachedData(cacheKey, extractedLocation);

    logger.info(`Location extracted from description: "${extractedLocation}"`);
    return extractedLocation;
  } catch (error) {
    logger.error('Error extracting location from description:', error.message);
    
    const locationPatterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /near\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        logger.info(`Fallback location extraction: "${match[1]}"`);
        return match[1];
      }
    }

    return null;
  }
};

const verifyImageWithGemini = async (imageUrl) => {
  try {
    const cacheKey = `gemini_verify_${Buffer.from(imageUrl).toString('base64').substring(0, 50)}`;
    
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let imageData;
    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 10 * 1024 * 1024
      });
      imageData = Buffer.from(imageResponse.data).toString('base64');
    } catch (error) {
      logger.error('Error downloading image for verification:', error.message);
      throw new Error('Could not download image for verification');
    }

    const prompt = `Analyze this image for signs of disaster and authenticity. Provide your analysis in JSON format with the following structure:
{
  "is_authentic": boolean,
  "confidence": number (0-1),
  "analysis": "description of what you see",
  "detected_objects": ["list", "of", "objects"],
  "manipulation_indicators": ["list", "of", "potential", "manipulation", "signs"],
  "disaster_related": boolean,
  "disaster_type": "type of disaster if detected"
}

Focus on identifying:
1. Signs of natural disasters (flooding, fire, earthquake damage, etc.)
2. Any obvious signs of image manipulation or editing
3. Whether the image appears to be authentic documentary evidence
4. Objects and scenes that indicate emergency situations`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysisText = response.data.candidates[0].content.parts[0].text.trim();
    
    let verificationResult;
    try {
      verificationResult = JSON.parse(analysisText);
    } catch (parseError) {
      verificationResult = {
        is_authentic: true,
        confidence: 0.7,
        analysis: analysisText,
        detected_objects: [],
        manipulation_indicators: [],
        disaster_related: analysisText.toLowerCase().includes('disaster') || 
                         analysisText.toLowerCase().includes('emergency'),
        disaster_type: 'unknown'
      };
    }

    verificationResult = {
      is_authentic: verificationResult.is_authentic !== false,
      confidence: verificationResult.confidence || 0.5,
      analysis: verificationResult.analysis || 'Analysis completed',
      detected_objects: verificationResult.detected_objects || [],
      manipulation_indicators: verificationResult.manipulation_indicators || [],
      disaster_related: verificationResult.disaster_related || false,
      disaster_type: verificationResult.disaster_type || 'unknown',
      verified_at: new Date().toISOString()
    };

    await setCachedData(cacheKey, verificationResult, 24 * 60 * 60 * 1000);

    logger.info(`Image verification completed: ${verificationResult.is_authentic ? 'AUTHENTIC' : 'FLAGGED'}`);
    return verificationResult;
  } catch (error) {
    logger.error('Error verifying image with Gemini:', error.message);
    
    return {
      is_authentic: true,
      confidence: 0.5,
      analysis: 'Could not complete AI verification, manual review recommended',
      detected_objects: [],
      manipulation_indicators: ['AI verification failed'],
      disaster_related: false,
      disaster_type: 'unknown',
      verified_at: new Date().toISOString(),
      error: error.message
    };
  }
};

module.exports = {
  extractLocationFromDescription,
  verifyImageWithGemini
};
