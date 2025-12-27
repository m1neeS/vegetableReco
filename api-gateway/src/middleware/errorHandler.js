/**
 * Global error handling middleware
 */

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(502).json({ error: 'Service unavailable' });
  }

  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(504).json({ error: 'Request timeout' });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({ error: 'Database constraint violation' });
  }

  if (err.code === '42P01') {
    return res.status(500).json({ error: 'Database table not found' });
  }

  // Default server error
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
}

module.exports = { errorHandler };
