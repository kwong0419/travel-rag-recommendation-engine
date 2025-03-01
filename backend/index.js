require('dotenv').config({path: '../.env'})
const express = require('express')
const cors = require('cors')
const recommendationRoutes = require('./routes/recommendationRoutes')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', recommendationRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
