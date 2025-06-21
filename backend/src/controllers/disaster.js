const supabase = require('../services/supabase');
const logger = require('../utils/logger');
const { extractLocationFromDescription } = require('../services/gemini');
const { geocodeLocation } = require('../services/maps');

const createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags } = req.body;
    const owner_id = req.user.id;

    let finalLocationName = location_name;
    if (!location_name && description) {
      try {
        finalLocationName = await extractLocationFromDescription(description);
      } catch (error) {
        logger.warn('Failed to extract location from description:', error.message);
      }
    }

    let coordinates = null;
    if (finalLocationName) {
      try {
        coordinates = await geocodeLocation(finalLocationName);
      } catch (error) {
        logger.warn('Failed to geocode location:', error.message);
      }
    }

    const auditTrail = {
      action: 'create',
      user_id: owner_id,
      timestamp: new Date().toISOString()
    };

    let locationPoint = null;
    if (coordinates) {
      locationPoint = `POINT(${coordinates.lng} ${coordinates.lat})`;
    }

    const { data, error } = await supabase
      .from('disasters')
      .insert([{
        title,
        location_name: finalLocationName,
        location: locationPoint,
        description,
        tags: tags || [],
        owner_id,
        audit_trail: [auditTrail]
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating disaster:', error);
      return res.status(400).json({ error: error.message });
    }

    req.io.emit('disaster_created', data);

    logger.info(`Disaster created: ${title} by ${owner_id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error in createDisaster:', error);
    res.status(500).json({ error: 'Failed to create disaster' });
  }
};

const getDisasters = async (req, res) => {
  try {
    const { tag, owner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching disasters:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in getDisasters:', error);
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
};

const getDisasterById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching disaster:', error);
      return res.status(404).json({ error: 'Disaster not found' });
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in getDisasterById:', error);
    res.status(500).json({ error: 'Failed to fetch disaster' });
  }
};

const updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;
    const user_id = req.user.id;

    const { data: existing } = await supabase
      .from('disasters')
      .select('owner_id, audit_trail')
      .eq('id', id)
      .single();

    if (!existing || existing.owner_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let coordinates = null;
    if (location_name) {
      try {
        coordinates = await geocodeLocation(location_name);
      } catch (error) {
        logger.warn('Failed to geocode location:', error.message);
      }
    }

    const auditTrail = [
      ...(existing.audit_trail || []),
      {
        action: 'update',
        user_id,
        timestamp: new Date().toISOString()
      }
    ];

    const updateData = {
      title,
      location_name,
      description,
      tags: tags || [],
      audit_trail: auditTrail
    };

    if (coordinates) {
      updateData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
    }

    const { data, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating disaster:', error);
      return res.status(400).json({ error: error.message });
    }

    req.io.emit('disaster_updated', data);

    logger.info(`Disaster updated: ${id} by ${user_id}`);
    res.json(data);
  } catch (error) {
    logger.error('Error in updateDisaster:', error);
    res.status(500).json({ error: 'Failed to update disaster' });
  }
};

const deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: existing } = await supabase
      .from('disasters')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!existing || existing.owner_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting disaster:', error);
      return res.status(400).json({ error: error.message });
    }

    req.io.emit('disaster_deleted', { id });

    logger.info(`Disaster deleted: ${id} by ${user_id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error in deleteDisaster:', error);
    res.status(500).json({ error: 'Failed to delete disaster' });
  }
};

const createReport = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { content, image_url } = req.body;
    const user_id = req.user.id;

    const { data, error } = await supabase
      .from('reports')
      .insert([{
        disaster_id,
        user_id,
        content,
        image_url,
        verification_status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating report:', error);
      return res.status(400).json({ error: error.message });
    }

    logger.info(`Report created for disaster ${disaster_id} by ${user_id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Error in createReport:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

const getReports = async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('disaster_id', disaster_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching reports:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in getReports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

module.exports = {
  createDisaster,
  getDisasters,
  getDisasterById,
  updateDisaster,
  deleteDisaster,
  createReport,
  getReports
};
