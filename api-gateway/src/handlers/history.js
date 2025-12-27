/**
 * History handlers - manage prediction history
 */
const { getPredictions, deletePrediction } = require('../db');

/**
 * Get prediction history
 */
async function getHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const predictions = await getPredictions(limit, offset);

    // Transform to camelCase for frontend
    const history = predictions.map(p => ({
      id: p.id,
      imageFilename: p.image_filename,
      imagePath: p.image_path,
      predictedClass: p.predicted_class,
      confidence: parseFloat(p.confidence),
      top3Predictions: p.top_3_predictions,
      llmRecommendation: p.llm_recommendation,
      createdAt: p.created_at
    }));

    res.json(history);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete prediction by ID
 */
async function deleteHistory(req, res, next) {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const deleted = await deletePrediction(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json({ success: true, deleted: { id: deleted.id } });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHistory, deleteHistory };
