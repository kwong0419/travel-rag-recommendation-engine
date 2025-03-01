import React, {useState} from 'react'
import axios from 'axios'
import {Box, Text, Button, Textarea, VStack} from '@chakra-ui/react'
import {useToast} from '@chakra-ui/toast'

interface TravelPreferences {
  preferences: string
  location?: string
  budget_range?: number
  travel_style?: string
}

interface Recommendation {
  id: number
  location: string
  preferences: string
  travel_style: string
  budget_range: number
  creativeDescription: string
  weighted_similarity: number
}

export const TravelForm: React.FC = () => {
  const [preferences, setPreferences] = useState<TravelPreferences>({
    preferences: '',
  })
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:3000/api/recommendations', preferences)
      setRecommendations(response.data.recommendations)

      // Show remaining rate limit info
      toast({
        title: 'Recommendations found!',
        description: `Remaining requests: ${response.data.remaining}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to get recommendations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <VStack spacing={6} width="100%" maxW="800px" margin="auto" p={4}>
      <form onSubmit={handleSubmit} style={{width: '100%'}}>
        <VStack spacing={4}>
          <Textarea
            value={preferences.preferences}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                preferences: e.target.value,
              })
            }
            placeholder="Describe your ideal vacation..."
            size="lg"
            minH="150px"
          />
          <Button type="submit" colorScheme="blue" isLoading={loading} width="100%">
            Get Recommendations
          </Button>
        </VStack>
      </form>

      {recommendations.length > 0 && (
        <VStack spacing={4} width="100%">
          <Text fontSize="2xl" fontWeight="bold">
            Your Recommendations
          </Text>
          {recommendations.map((rec) => (
            <Box key={rec.id} p={6} borderWidth={1} borderRadius="lg" width="100%" boxShadow="md">
              <Text fontSize="xl" fontWeight="bold">
                {rec.location}
              </Text>
              <Text mt={2} color="gray.600">
                {rec.creativeDescription}
              </Text>
              <Text mt={2}>Travel Style: {rec.travel_style}</Text>
              <Text>Budget Range: ${rec.budget_range}</Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Match Score: {(1 - rec.weighted_similarity).toFixed(2)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  )
}

export default TravelForm
