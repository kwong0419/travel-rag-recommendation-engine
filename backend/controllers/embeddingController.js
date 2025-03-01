const {GoogleGenerativeAI} = require('@google/generative-ai')
const {Pool} = require('pg')

class EmbeddingController {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({model: 'embedding-001'})

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  async generateEmbedding(text) {
    try {
      const result = await this.model.embedContent(text)
      return result.embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async findSimilarProfiles(embedding) {
    const query = `
      SELECT 
        id,
        preferences,
        location,
        budget_range,
        travel_style,
        (1 - (embedding <=> $1::vector)) as similarity_score
      FROM travel_profiles
      WHERE embedding IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT 5;
    `

    try {
      const result = await this.pool.query(query, [embedding])
      return result.rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async findSimilarProfilesWeighted(embedding, preferences) {
    const query = `
      SELECT 
        id,
        preferences,
        location,
        budget_range,
        travel_style,
        (1 - (embedding <=> $1)) as similarity_score
      FROM travel_profiles
      WHERE embedding IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT 5;
    `

    const result = await this.pool.query(query, [embedding])
    return result.rows
  }

  async generateCreativeDescription(recommendation) {
    const prompt = `
      Create an engaging travel description for:
      Location: ${recommendation.location}
      Travel Style: ${recommendation.travel_style}
      Budget Range: $${recommendation.budget_range}
      Context: ${recommendation.preferences}
      
      Please provide a creative, personalized description in 2-3 sentences.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Error generating description:', error)
      return recommendation.preferences
    }
  }

  async getEnhancedRecommendations(preferences) {
    // Generate embedding for user preferences
    const embedding = await this.generateEmbedding(preferences.preferences)

    // Get weighted recommendations
    const recommendations = await this.findSimilarProfilesWeighted(embedding, preferences)

    // Enhance recommendations with creative descriptions
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const creativeDescription = await this.generateCreativeDescription(rec)
        return {
          ...rec,
          creativeDescription,
        }
      }),
    )

    return enhancedRecommendations
  }
}

module.exports = EmbeddingController
