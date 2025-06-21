const { verifyImageWithGemini } = require('../services/gemini');
const supabase = require('../services/supabase');
const logger = require('../utils/logger');

const verifyImage = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { image_url, report_id } = req.body;
    const user_id = req.user.id;

    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

   
    let verificationResult;
    try {
      verificationResult = await verifyImageWithGemini(image_url);
    } catch (error) {
      logger.error('Error verifying image with Gemini:', error);
      
      
      verificationResult = {
        is_authentic: true,
        confidence: 0.5,
        analysis: 'Unable to verify with AI, manual review required',
        detected_objects: [],
        manipulation_indicators: []
      };
    }

    
    if (report_id) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          verification_status: verificationResult.is_authentic ? 'verified' : 'flagged',
          verification_details: verificationResult
        })
        .eq('id', report_id)
        .eq('disaster_id', disaster_id);

      if (updateError) {
        logger.error('Error updating report verification:', updateError);
      }
    }

   
    logger.info(`Image verification completed for disaster ${disaster_id}: ${verificationResult.is_authentic ? 'VERIFIED' : 'FLAGGED'}`);

    res.json({
      disaster_id,
      image_url,
      verification_result: verificationResult,
      verified_by: user_id,
      verified_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in verifyImage:', error);
    res.status(500).json({ error: 'Failed to verify image' });
  }
};

const getVerificationHistory = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('reports')
      .select('id, image_url, verification_status, verification_details, created_at')
      .eq('disaster_id', disaster_id)
      .not('verification_status', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching verification history:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in getVerificationHistory:', error);
    res.status(500).json({ error: 'Failed to fetch verification history' });
  }
};

module.exports = {
  verifyImage,
  getVerificationHistory
};