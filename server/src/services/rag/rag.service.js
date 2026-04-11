/**
 * RAG (Retrieval-Augmented Generation) Service
 * Retrieves relevant knowledge from the knowledge base
 * Uses simple keyword matching and semantic similarity
 */

const knowledgeBase = require('./knowledge-base');
const { cosineSimilarity } = require('../../utils/helpers');

/**
 * Simple embedding simulation
 * In production, this would use Gemini embeddings or a similar embedding provider
 * Here we use a simplified approach for demonstration
 */

/**
 * Extract keywords from text
 * @param {string} text - Input text
 * @returns {Array} Array of keywords
 */
const extractKeywords = (text) => {
  // Remove common words and punctuation
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
    'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
    't', 'can', 'will', 'just', 'don', 'should', 'now', 'im', 'ive', 'dont', 'cant',
    'could', 'would', 'should', 'might', 'must', 'may'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)];
};

/**
 * Calculate simple text similarity
 * Uses Jaccard similarity on keywords
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 */
const calculateSimilarity = (text1, text2) => {
  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));

  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  // Jaccard similarity
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);

  return intersection.size / union.size;
};

/**
 * Create a simple embedding vector for text
 * This is a simplified version - production would use Gemini embeddings
 * @param {string} text - Input text
 * @returns {Array} Simple embedding vector
 */
const createSimpleEmbedding = (text) => {
  const keywords = extractKeywords(text);

  // Create a simple bag-of-words style embedding
  // Each position represents presence of certain word categories
  const categories = {
    emotions: ['sad', 'happy', 'anxious', 'angry', 'stressed', 'hopeful', 'confused', 'calm', 'overwhelmed', 'depressed', 'scared', 'worried', 'nervous'],
    actions: ['help', 'need', 'want', 'feel', 'think', 'try', 'do', 'make', 'take', 'get', 'give', 'find'],
    crisis: ['suicide', 'kill', 'die', 'harm', 'hurt', 'end', 'death', 'dangerous', 'emergency'],
    coping: ['breathe', 'relax', 'calm', 'exercise', 'meditate', 'sleep', 'rest', 'practice', 'technique'],
    relationships: ['friend', 'family', 'partner', 'relationship', 'love', 'support', 'talk', 'communicate'],
    work: ['work', 'job', 'career', 'boss', 'stress', 'pressure', 'deadline', 'office'],
    self: ['myself', 'self', 'worth', 'confidence', 'esteem', 'value', 'identity']
  };

  const embedding = [];
  for (const [category, words] of Object.entries(categories)) {
    const score = keywords.reduce((acc, kw) => {
      return acc + (words.some(w => kw.includes(w) || w.includes(kw)) ? 1 : 0);
    }, 0) / Math.max(keywords.length, 1);
    embedding.push(score);
  }

  return embedding;
};

/**
 * Retrieve relevant knowledge from the knowledge base
 * @param {string} query - User's query or message
 * @param {string} mood - Detected mood (optional)
 * @param {number} topK - Number of results to return
 * @returns {Object} Retrieval result with relevant documents
 */
const retrieveKnowledge = async (query, mood = null, topK = 3) => {
  try {
    // Calculate relevance scores for each knowledge base entry
    const scoredDocs = knowledgeBase.map(doc => {
      // Keyword matching score
      const keywordScore = doc.keywords.reduce((acc, keyword) => {
        return acc + (query.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0) / doc.keywords.length;

      // Text similarity score
      const similarityScore = calculateSimilarity(query, doc.content);

      // Category relevance (if mood matches category)
      let categoryScore = 0;
      if (mood) {
        const moodCategoryMap = {
          'anxious': ['anxiety', 'stress'],
          'stressed': ['stress', 'work-life'],
          'sad': ['depression', 'self-esteem'],
          'angry': ['relationships', 'stress'],
          'hopeless': ['depression', 'crisis'],
          'confused': ['mindfulness', 'self-esteem']
        };
        if (moodCategoryMap[mood]?.includes(doc.category)) {
          categoryScore = 0.5;
        }
      }

      // Crisis detection - always prioritize crisis resources
      let crisisBoost = 0;
      const crisisKeywords = ['suicide', 'kill myself', 'harm myself', 'die', 'end my life', 'crisis'];
      if (crisisKeywords.some(kw => query.toLowerCase().includes(kw)) && doc.category === 'crisis') {
        crisisBoost = 1.0;
      }

      // Combined score
      const totalScore = (keywordScore * 0.3) + (similarityScore * 0.4) + categoryScore + crisisBoost;

      return {
        ...doc,
        score: totalScore,
        keywordMatch: keywordScore,
        similarity: similarityScore
      };
    });

    // Sort by score and take top K
    const relevantDocs = scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(doc => doc.score > 0.05) // Minimum relevance threshold
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        content: doc.content,
        tags: doc.tags,
        relevanceScore: doc.score.toFixed(2)
      }));

    return {
      success: true,
      query: query,
      relevantDocs: relevantDocs,
      totalFound: relevantDocs.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('RAG retrieval error:', error);

    return {
      success: false,
      query: query,
      relevantDocs: [],
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get knowledge by category
 * @param {string} category - Knowledge category
 * @returns {Object} Knowledge document
 */
const getKnowledgeByCategory = (category) => {
  return knowledgeBase.find(doc => doc.category === category) || null;
};

/**
 * Get all knowledge categories
 * @returns {Array} List of categories
 */
const getAllCategories = () => {
  return [...new Set(knowledgeBase.map(doc => doc.category))];
};

/**
 * Search knowledge base with filters
 * @param {Object} filters - Search filters
 * @returns {Array} Filtered knowledge documents
 */
const searchKnowledge = (filters = {}) => {
  let results = [...knowledgeBase];

  if (filters.category) {
    results = results.filter(doc => doc.category === filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(doc =>
      filters.tags.some(tag => doc.tags.includes(tag))
    );
  }

  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    results = results.filter(doc =>
      doc.keywords.some(kw => kw.includes(keyword)) ||
      doc.content.toLowerCase().includes(keyword) ||
      doc.title.toLowerCase().includes(keyword)
    );
  }

  return results;
};

/**
 * Add new knowledge (for future extensibility)
 * Note: In production, this would persist to a database
 * @param {Object} knowledge - Knowledge document to add
 * @returns {Object} Added knowledge with ID
 */
const addKnowledge = (knowledge) => {
  const newKnowledge = {
    id: `kb_${Date.now()}`,
    ...knowledge,
    createdAt: new Date().toISOString()
  };

  // In a real implementation, this would save to a database
  // For now, we just return the knowledge object
  console.log('Knowledge added:', newKnowledge.id);

  return newKnowledge;
};

module.exports = {
  retrieveKnowledge,
  getKnowledgeByCategory,
  getAllCategories,
  searchKnowledge,
  addKnowledge,
  extractKeywords,
  calculateSimilarity
};
