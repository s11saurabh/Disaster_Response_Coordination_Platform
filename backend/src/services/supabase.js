const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  logger.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('disasters')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Supabase connection test failed:', error);
    } else {
      logger.info('✅ Supabase connection successful');
    }
  } catch (error) {
    logger.error('Supabase connection error:', error);
  }
};

const initializeTables = async () => {
  try {
    logger.info('Database tables should be created via Supabase dashboard or migrations');
    logger.info('Required tables: disasters, reports, resources, cache');
  } catch (error) {
    logger.error('Error initializing tables:', error);
  }
};

const createCustomFunctions = async () => {
  const nearbyResourcesFunction = `
    CREATE OR REPLACE FUNCTION get_nearby_resources(
      p_disaster_id UUID,
      p_lat FLOAT,
      p_lon FLOAT,
      p_radius INTEGER DEFAULT 10000,
      p_type TEXT DEFAULT NULL
    )
    RETURNS TABLE (
      id UUID,
      disaster_id UUID,
      name TEXT,
      location_name TEXT,
      type TEXT,
      description TEXT,
      contact_info TEXT,
      created_at TIMESTAMPTZ,
      distance FLOAT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        r.id,
        r.disaster_id,
        r.name,
        r.location_name,
        r.type,
        r.description,
        r.contact_info,
        r.created_at,
        ST_Distance(r.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326)) as distance
      FROM resources r
      WHERE r.disaster_id = p_disaster_id
      AND ST_DWithin(r.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326), p_radius)
      AND (p_type IS NULL OR r.type = p_type)
      ORDER BY distance ASC;
    END;
    $$;
  `;
  
  logger.info('Custom RPC functions should be created via Supabase SQL editor');
};

testConnection();

module.exports = supabase;
