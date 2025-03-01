const fs = require('fs')
const {Pool} = require('pg')
const csv = require('csv-parse')

require('dotenv').config({path: '../.env'})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function generateMockEmbedding(text) {
  // Add null check for text
  if (!text) {
    console.warn('Warning: Empty text received for embedding generation')
    text = ''
  }

  // Create a deterministic mock embedding based on text content
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = (seed) => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  // Generate 768 dimensions to match Gemini's embedding size
  return Array(768)
    .fill(0)
    .map((_, i) => random(seed + i) - 0.5)
}

async function loadData() {
  try {
    console.log('Reading CSV file...')
    const fileContent = fs.readFileSync('./mountains_vs_beaches_preferences.csv', 'utf-8')
    console.log('CSV file read successfully')

    const records = await new Promise((resolve, reject) => {
      csv.parse(
        fileContent,
        {
          columns: true,
          skip_empty_lines: true,
        },
        (err, records) => {
          if (err) reject(err)
          else resolve(records)
        },
      )
    })

    console.log(`Found ${records.length} records in CSV`)
    console.log('Sample record:', records[0])

    // First, clear existing data
    await pool.query('TRUNCATE TABLE travel_profiles')

    let inserted = 0
    for (const record of records) {
      // Create preferences string from relevant fields
      const preferences = {
        age: parseInt(record.Age),
        gender: record.Gender,
        activities: record.Preferred_Activities,
        location: record.Location,
        season: record.Favorite_Season,
        hasPets: record.Pets === '1',
        environmentalConcerns: record.Environmental_Concerns === '1',
      }

      // Generate mock embedding and format it correctly for pgvector
      const embedding = Array(768)
        .fill(0)
        .map(() => Math.random() - 0.5)
      const vectorString = `[${embedding.join(',')}]` // Format as [n1,n2,n3,...]

      await pool.query(
        `INSERT INTO travel_profiles (
          preferences, 
          location, 
          travel_style, 
          budget_range, 
          embedding,
          mountains_vs_beaches_preference
        ) VALUES ($1, $2, $3, $4, $5::vector, $6)`, // Add ::vector type cast
        [
          JSON.stringify(preferences),
          record.Location,
          record.Preferred_Activities,
          parseInt(record.Vacation_Budget),
          vectorString, // Use the formatted string
          parseInt(record.Preference),
        ],
      )
      inserted++
      if (inserted % 100 === 0) {
        console.log(`Inserted ${inserted} records...`)
      }
    }

    const countCheck = await pool.query('SELECT COUNT(*) FROM travel_profiles')
    console.log(`Final row count in database: ${countCheck.rows[0].count}`)
    console.log(`Successfully loaded ${inserted} records into database`)
  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    await pool.end()
  }
}

loadData().catch(console.error)
