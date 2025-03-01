const {OpenAI} = require('openai')
const {Pool} = require('pg')

class EmbeddingController {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        input: text,
        model: 'text-embedding-3-small',
      })
      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async findSimilarProfiles(embedding, limit = 5) {
    const query = `
            SELECT 
                id,
                preferences,
                location,
                budget_range,
                travel_style,
                (embedding <=> $1) as similarity
            FROM travel_profiles
            ORDER BY embedding <=> $1
            LIMIT $5;
        `

    const result = await this.pool.query(query, [embedding, limit])
    return result.rows
  }

  async findSimilarProfilesWeighted(embedding, preferences) {
    const query = `
        SELECT 
            id,
            preferences,
            location,
            budget_range,
            travel_style,
            (
                0.6 * (embedding <=> $1) +  -- Base similarity
                0.2 * (ABS(budget_range - $2) / 1000) +  -- Budget similarity
                0.2 * CASE  -- Travel style match
                    WHEN travel_style = $3 THEN 0
                    ELSE 1
                END
            ) as weighted_similarity
        FROM travel_profiles
        ORDER BY weighted_similarity ASC
        LIMIT 5;
    `

    const result = await this.pool.query(query, [
      embedding,
      preferences.budget_range || 0,
      preferences.travel_style || '',
    ])
    return result.rows
  }

  async generateCreativeDescription(recommendation) {
    const prompt = `
        Create an engaging travel description for a destination with these characteristics:
        Location: ${recommendation.location}
        Travel Style: ${recommendation.travel_style}
        Budget Range: $${recommendation.budget_range}
        
        Additional Context: ${recommendation.preferences}
        
        Please provide a creative, personalized description in 2-3 sentences.
    `

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert who creates engaging, personalized travel descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Error generating creative description:', error)
      return null
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
