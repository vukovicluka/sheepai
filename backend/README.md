# Hacker News Scraper Backend

A Node.js backend server that scrapes The Hacker News, processes articles using OpenAI API, stores them in MongoDB, and provides a REST API with advanced features.

## Features

- **Web Scraping**: Automated scraping of The Hacker News using Cheerio
- **AI Processing**: Article summarization and analysis using OpenAI API
- **Automated Scheduling**: Daily article fetching using node-cron
- **MongoDB Storage**: Persistent storage with duplicate detection
- **REST API**: Full-featured API with pagination, filtering, search, and statistics

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local, Docker, or cloud instance)
- OpenAI API key
- Docker and Docker Compose (optional, for MongoDB container)

## Installation

1. Install dependencies:
```bash
npm install
```

2. **Start MongoDB using Docker Compose (Recommended):**
```bash
docker-compose up -d
```
This will start MongoDB in a Docker container on port 27017. The data will persist in Docker volumes.

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hacker-news-scraper
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
CRON_SCHEDULE=0 9 * * *
```

**Note:** If you're using a different MongoDB setup, see `MONGODB_SETUP.md` for alternative installation methods.

## Usage

### Start MongoDB (if using Docker Compose):
```bash
docker-compose up -d
```

### Stop MongoDB:
```bash
docker-compose down
```

### Start the server:
```bash
npm start
```

### Development mode (with auto-reload):
```bash
npm run dev
```

## API Endpoints

### Get All Articles
```
GET /api/articles
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10, max: 100)
  - sortBy: Field to sort by (default: publishedDate)
  - sortOrder: asc or desc (default: desc)
  - category: Filter by category keyword (searches in title and content)
  - tag: Filter by tag
  - startDate: Filter by start date (ISO format)
  - endDate: Filter by end date (ISO format)
```

### Get Article by ID
```
GET /api/articles/:id
```

### Get Latest Articles
```
GET /api/articles/latest
Query Parameters:
  - limit: Number of articles (default: 10)
  - category: Filter by category keyword (searches in title and content)
```

### Search Articles
```
GET /api/articles/search?q=query
Query Parameters:
  - q: Search query (required)
  - page: Page number
  - limit: Items per page
  - category: Filter by category keyword (searches in title and content)
```

### Get Statistics
```
GET /api/articles/stats
Query Parameters:
  - category: Filter statistics by category keyword (optional)
Returns:
  - totalArticles
  - articlesByDate (last 30 days)
  - articlesByTag (top 20)
  - articlesBySentiment
```

### Get All Tags
```
GET /api/articles/tags
```

### Health Check
```
GET /health
```

## Cron Schedule

The scraper runs automatically based on the `CRON_SCHEDULE` environment variable.

Cron format: `minute hour day month day-of-week`

Examples:
- `0 9 * * *` - Daily at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight

To run immediately on startup (for testing), set:
```env
RUN_ON_STARTUP=true
```

## Category Filtering

The API supports filtering articles by category keywords. Categories are matched case-insensitively in article titles and content.

### Via REST API
Add the `category` query parameter to any article endpoint:
```bash
# Get articles about ransomware
GET /api/articles?category=ransomware

# Search for phishing articles
GET /api/articles/search?q=attack&category=phishing

# Get latest ransomware articles
GET /api/articles/latest?category=ransomware&limit=5
```

### Via Environment Variable (Scheduled Scraping)
Set `CATEGORY_FILTER` in your `.env` file to filter articles during scheduled scraping:
```env
CATEGORY_FILTER=ransomware
```

This will make the cron job only scrape and process articles that contain the category keyword in their title or content.

## Project Structure

```
backend/
├── src/
│   ├── server.js              # Express server entry point
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/
│   │   └── Article.js         # Mongoose schema
│   ├── services/
│   │   ├── scraper.js         # Web scraper
│   │   ├── aiProcessor.js     # AI processing
│   │   └── scheduler.js       # Cron scheduler
│   ├── routes/
│   │   └── articles.js        # API routes
│   ├── controllers/
│   │   └── articleController.js # Request handlers
│   └── utils/
│       └── logger.js          # Logging utility
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo, gpt-4-turbo) | gpt-3.5-turbo |
| `CRON_SCHEDULE` | Cron schedule expression | `0 9 * * *` |
| `CATEGORY_FILTER` | Category keyword for scheduled scraping (optional) | - |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |
| `RUN_ON_STARTUP` | Run scraper on startup | false |

## Error Handling

The server includes comprehensive error handling:
- Validation errors return 400 with details
- Not found errors return 404
- Server errors return 500
- All errors are logged

## Logging

Logging levels:
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debugging

Set `LOG_LEVEL` in `.env` to control verbosity.

## Notes

- The scraper limits to 20 articles per run to avoid overwhelming the source
- Duplicate articles are detected by URL and skipped
- AI processing includes rate limiting (1 second between requests)
- The scraper includes retry logic and error handling

