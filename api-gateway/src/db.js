/**
 * Database connection and initialization
 */
const { Pool } = require('pg');

// Check if database is configured
const DB_ENABLED = process.env.DATABASE_URL || process.env.DB_HOST;

const pool = DB_ENABLED ? new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vegetable_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
}) : null;

/**
 * Initialize database with required tables
 */
async function initDatabase() {
  if (!pool) {
    console.log('Database not configured - running without persistence');
    return;
  }
  
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_filename VARCHAR(255) NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        predicted_class VARCHAR(100) NOT NULL,
        confidence DECIMAL(5,4) NOT NULL,
        top_3_predictions JSONB NOT NULL,
        llm_recommendation JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_created_at 
      ON predictions(created_at DESC)
    `);
    
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

/**
 * Save prediction to database
 */
async function savePrediction(data) {
  if (!pool) {
    // Return mock data when database is not available
    return {
      id: require('crypto').randomUUID(),
      ...data,
      created_at: new Date()
    };
  }
  
  const { imageFilename, imagePath, predictedClass, confidence, top3Predictions, llmRecommendation } = data;
  
  const result = await pool.query(
    `INSERT INTO predictions 
     (image_filename, image_path, predicted_class, confidence, top_3_predictions, llm_recommendation)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [imageFilename, imagePath, predictedClass, confidence, JSON.stringify(top3Predictions), JSON.stringify(llmRecommendation)]
  );
  
  return result.rows[0];
}

/**
 * Get all predictions
 */
async function getPredictions(limit = 50, offset = 0) {
  if (!pool) {
    return [];
  }
  
  const result = await pool.query(
    `SELECT * FROM predictions ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

/**
 * Delete prediction by ID
 */
async function deletePrediction(id) {
  if (!pool) {
    return { id };
  }
  
  const result = await pool.query(
    `DELETE FROM predictions WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  pool,
  initDatabase,
  savePrediction,
  getPredictions,
  deletePrediction
};
