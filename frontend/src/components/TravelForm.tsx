import React, {useState} from 'react'
import axios from 'axios'

interface TravelPreferences {
  preferences: string
  location?: string
  budget_range?: number
  travel_style?: string
}

export const TravelForm: React.FC = () => {
  const [preferences, setPreferences] = useState<TravelPreferences>({
    preferences: '',
  })
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:3000/api/recommendations', preferences)
      setRecommendations(response.data.recommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="travel-form">
      <form onSubmit={handleSubmit}>
        <textarea
          value={preferences.preferences}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              preferences: e.target.value,
            })
          }
          placeholder="Describe your ideal vacation..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Finding matches...' : 'Get Recommendations'}
        </button>
      </form>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>Your Recommendations</h2>
          <ul>
            {recommendations.map((rec: any) => (
              <li key={rec.id}>
                <h3>{rec.location}</h3>
                <p>{rec.preferences}</p>
                <p>Travel Style: {rec.travel_style}</p>
                <p>Budget Range: ${rec.budget_range}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
