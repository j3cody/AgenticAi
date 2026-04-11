/**
 * Utility Helper Functions
 * Common functions used across the application
 */

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Format date to ISO string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toISOString();
};

/**
 * Sanitize user input to prevent injection
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Calculate cosine similarity between two vectors
 * Used for semantic similarity in RAG
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Similarity score between 0 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
};

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Resolves after delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateId,
  formatDate,
  sanitizeInput,
  cosineSimilarity,
  delay
};