const express = require('express')
const router = express.Router()
const EmbeddingController = require('../controllers/embeddingController')
const rateLimiter = require('../middleware/rateLimiter')

// Fix: Create a single instance of EmbeddingController
const embeddingController = new EmbeddingController()

router.post('/recommendations', rateLimiter, async (req, res) => {
  try {
    const {preferences} = req.body
    const embedding = await embeddingController.generateEmbedding(preferences)
    const recommendations = await embeddingController.findSimilarProfiles(embedding)

    res.json({
      recommendations,
      // Remove rate limit info since we're using mock data
      remaining: 100,
      resetTime: new Date(),
    })
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
})

module.exports = router
