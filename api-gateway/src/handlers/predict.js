/**
 * Prediction handler - integrates ML Service and LLM Service
 */
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const { savePrediction } = require('../db');
const { getLLMRecommendation } = require('../llm');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Handle prediction request
 */
async function predictHandler(req, res, next) {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Forward to ML Service
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: originalname,
      contentType: mimetype
    });

    let mlResponse;
    try {
      mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return res.status(502).json({ error: 'ML service unavailable' });
      }
      throw error;
    }

    const prediction = mlResponse.data;

    // Get LLM recommendation (skip if SKIP_LLM is set or Ollama not configured)
    let recommendation;
    const skipLLM = process.env.SKIP_LLM === 'true' || !process.env.OLLAMA_URL;
    
    if (skipLLM) {
      recommendation = getFallbackRecommendation();
    } else {
      try {
        recommendation = await getLLMRecommendation(prediction.predicted_class);
      } catch (error) {
        console.error('LLM error, using fallback:', error.message);
        recommendation = getFallbackRecommendation();
      }
    }

    // Generate unique image path
    const imagePath = `/uploads/${uuidv4()}_${originalname}`;

    // Save to database
    const savedRecord = await savePrediction({
      imageFilename: originalname,
      imagePath,
      predictedClass: prediction.predicted_class,
      confidence: prediction.confidence,
      top3Predictions: prediction.top_3,
      llmRecommendation: recommendation
    });

    // Return response
    res.json({
      id: savedRecord.id,
      prediction: {
        predicted_class: prediction.predicted_class,
        confidence: prediction.confidence,
        top_3: prediction.top_3
      },
      recommendation,
      created_at: savedRecord.created_at
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Fallback recommendation when LLM is unavailable
 */
function getFallbackRecommendation() {
  return {
    recipes: ['Rekomendasi tidak tersedia saat ini'],
    nutrition: { info: 'Informasi nutrisi tidak tersedia' },
    storageTips: 'Simpan di tempat sejuk dan kering'
  };
}

module.exports = { predictHandler, getFallbackRecommendation };
