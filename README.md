# Travel Preference Recommender

A personalized travel recommendation system that uses AI embeddings to match users with their ideal travel destinations based on their preferences between mountains and beaches.

## Features

- AI-powered preference matching using vector embeddings
- Real-time travel style recommendations
- PostgreSQL database with pgvector for similarity search
- Rate-limited API endpoints
- Modern React frontend with Material-UI

## Tech Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with pgvector extension
- **AI**: Google Gemini for embeddings
- **Authentication**: JWT (planned)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- pgvector extension installed

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd travel-recommender
```

2. Install dependencies:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up your environment variables:

```bash
# Backend .env
DATABASE_URL=postgresql://username:password@localhost:5432/travel_recommender
GEMINI_API_KEY=your_api_key
```

4. Initialize the database:

```bash
psql -U postgres
CREATE DATABASE travel_recommender;
\c travel_recommender
CREATE EXTENSION vector;
```

5. Load sample data:

```bash
cd backend
node scripts/loadData.js
```

### Running the Application

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Future Enhancements

- User authentication and profiles
- Vector caching
- Budget filtering
- More advanced CSS and Animation

## Contributing

Feel free to open issues or submit pull requests for any improvements you'd like to suggest.
