const express = require('express')
const router = express.Router()
const EmbeddingController = require('../controllers/embeddingController')

const EmbeddingController = new EmbeddingController()

router.post('/recommendations', async (req, res) => {
  try {
    const {preferences} = req.body

    // Generate embedding for user preferences
    const embedding = await EmbeddingController.generateEmbedding(preferences)

    // Find similar profiles
    const recommendations = await EmbeddingController.findSimilarProfiles(embedding)

    res.json({recommendations})
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({error: 'Internal server error'})
  }
})

module.exports = router
