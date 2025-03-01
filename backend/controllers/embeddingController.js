const {OpenAI} = require('openai')
const {Pool} = require('pg')

class EmbeddingController {
  constructor() {
    this.openai = new OpenAI(process.env.OPENAI_API_KEY)
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
}

module.exports = EmbeddingController
