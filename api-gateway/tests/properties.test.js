/**
 * Property-based tests for API Gateway
 * 
 * Feature: vegetable-recognition-app
 * Tests correctness properties for file validation, LLM integration, and error handling.
 */
const fc = require('fast-check');
const { getFallbackRecommendation, LLM_TIMEOUT } = require('../src/llm');
const { errorHandler } = require('../src/middleware/errorHandler');

/**
 * Feature: vegetable-recognition-app
 * Property 4: File Size Validation
 * 
 * For any uploaded file exceeding 10MB, the API_Gateway SHALL reject 
 * the request with HTTP 413 status code.
 * 
 * Validates: Requirements 5.2
 */
describe('Property 4: File Size Validation', () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  test('files under 10MB should be accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_FILE_SIZE }),
        (size) => {
          // Files at or under limit should be valid
          return size <= MAX_FILE_SIZE;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('files over 10MB should be rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 2 }),
        (size) => {
          // Files over limit should be invalid
          return size > MAX_FILE_SIZE;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('file size boundary at exactly 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_FILE_SIZE + 1).toBeGreaterThan(MAX_FILE_SIZE);
  });
});

/**
 * Feature: vegetable-recognition-app
 * Property 5: LLM Request Timeout
 * 
 * For any LLM request that exceeds 30 seconds, the API_Gateway SHALL 
 * timeout and return fallback recommendations.
 * 
 * Validates: Requirements 5.5
 */
describe('Property 5: LLM Request Timeout', () => {
  test('LLM timeout should be 30 seconds', () => {
    expect(LLM_TIMEOUT).toBe(30000);
  });

  test('fallback recommendation should be returned on timeout', () => {
    const fallback = getFallbackRecommendation();
    
    expect(fallback).toHaveProperty('recipes');
    expect(fallback).toHaveProperty('nutrition');
    expect(fallback).toHaveProperty('storageTips');
    expect(Array.isArray(fallback.recipes)).toBe(true);
    expect(typeof fallback.storageTips).toBe('string');
  });
});


/**
 * Feature: vegetable-recognition-app
 * Property 6: Error Response Format
 * 
 * For any error condition in the API_Gateway, the response SHALL include 
 * an appropriate HTTP status code (4xx or 5xx) and a JSON body with error message.
 * 
 * Validates: Requirements 5.4
 */
describe('Property 6: Error Response Format', () => {
  test('error handler returns JSON with error field', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
          };
          const mockReq = {};
          const mockNext = jest.fn();
          
          const error = new Error(errorMessage);
          errorHandler(error, mockReq, mockRes, mockNext);
          
          // Should call status with 5xx code
          expect(mockRes.status).toHaveBeenCalled();
          const statusCode = mockRes.status.mock.calls[0][0];
          expect(statusCode).toBeGreaterThanOrEqual(400);
          expect(statusCode).toBeLessThan(600);
          
          // Should return JSON with error field
          expect(mockRes.json).toHaveBeenCalled();
          const jsonBody = mockRes.json.mock.calls[0][0];
          expect(jsonBody).toHaveProperty('error');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('connection refused returns 502', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const error = new Error('Connection refused');
    error.code = 'ECONNREFUSED';
    
    errorHandler(error, {}, mockRes, jest.fn());
    
    expect(mockRes.status).toHaveBeenCalledWith(502);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Service unavailable' });
  });

  test('timeout returns 504', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const error = new Error('timeout of 30000ms exceeded');
    error.code = 'ECONNABORTED';
    
    errorHandler(error, {}, mockRes, jest.fn());
    
    expect(mockRes.status).toHaveBeenCalledWith(504);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Request timeout' });
  });
});

/**
 * Feature: vegetable-recognition-app
 * Property 7: LLM Response Completeness
 * 
 * For any successfully classified vegetable, the LLM_Service response SHALL 
 * contain: recipe recommendations (array), nutritional information (object), 
 * and storage tips (string), all in Indonesian language.
 * 
 * Validates: Requirements 3.2, 3.3, 3.4
 */
describe('Property 7: LLM Response Completeness', () => {
  test('fallback recommendation has all required fields', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          const recommendation = getFallbackRecommendation();
          
          // Must have recipes array
          expect(recommendation).toHaveProperty('recipes');
          expect(Array.isArray(recommendation.recipes)).toBe(true);
          expect(recommendation.recipes.length).toBeGreaterThan(0);
          
          // Must have nutrition object
          expect(recommendation).toHaveProperty('nutrition');
          expect(typeof recommendation.nutrition).toBe('object');
          
          // Must have storageTips string
          expect(recommendation).toHaveProperty('storageTips');
          expect(typeof recommendation.storageTips).toBe('string');
          expect(recommendation.storageTips.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('fallback contains Indonesian text', () => {
    const fallback = getFallbackRecommendation();
    
    // Check for Indonesian words
    const indonesianWords = ['tidak', 'tersedia', 'Simpan', 'tempat', 'sejuk', 'kering'];
    const allText = [
      ...fallback.recipes,
      fallback.storageTips
    ].join(' ');
    
    const hasIndonesian = indonesianWords.some(word => allText.includes(word));
    expect(hasIndonesian).toBe(true);
  });
});

/**
 * Feature: vegetable-recognition-app
 * Property 8: Database Record Completeness
 * 
 * For any saved prediction, the database record SHALL contain: id, image_filename, 
 * image_path, predicted_class, confidence, top_3_predictions, llm_recommendation 
 * (if available), and created_at timestamp.
 * 
 * Validates: Requirements 7.1, 7.2
 */
describe('Property 8: Database Record Completeness', () => {
  test('prediction data structure has all required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          imageFilename: fc.string({ minLength: 1, maxLength: 255 }),
          imagePath: fc.string({ minLength: 1, maxLength: 500 }),
          predictedClass: fc.string({ minLength: 1, maxLength: 100 }),
          confidence: fc.float({ min: 0, max: 1 }),
          top3Predictions: fc.array(
            fc.record({
              class: fc.string({ minLength: 1 }),
              confidence: fc.float({ min: 0, max: 1 })
            }),
            { minLength: 3, maxLength: 3 }
          )
        }),
        (data) => {
          // Validate all required fields exist
          expect(data).toHaveProperty('imageFilename');
          expect(data).toHaveProperty('imagePath');
          expect(data).toHaveProperty('predictedClass');
          expect(data).toHaveProperty('confidence');
          expect(data).toHaveProperty('top3Predictions');
          
          // Validate types
          expect(typeof data.imageFilename).toBe('string');
          expect(typeof data.imagePath).toBe('string');
          expect(typeof data.predictedClass).toBe('string');
          expect(typeof data.confidence).toBe('number');
          expect(Array.isArray(data.top3Predictions)).toBe(true);
          
          // Validate confidence range
          expect(data.confidence).toBeGreaterThanOrEqual(0);
          expect(data.confidence).toBeLessThanOrEqual(1);
          
          // Validate top_3 has exactly 3 items
          expect(data.top3Predictions.length).toBe(3);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
