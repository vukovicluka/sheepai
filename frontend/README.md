# SheepAI Frontend

A React frontend application that connects to the SheepAI backend REST API to display and manage articles.

## Features

- **Article List**: Browse all articles with pagination, filtering by category and tags
- **Latest Articles**: View the most recent articles
- **Article Detail**: View full article content with metadata
- **Search**: Search articles by title, content, or summary
- **Statistics**: View article statistics including sentiment distribution, top tags, and articles by date

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional) to configure the API URL:
```
VITE_API_URL=http://localhost:3000
```

If not set, it defaults to `http://localhost:3000`.

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## API Endpoints Used

- `GET /api/articles` - Get all articles with pagination and filters
- `GET /api/articles/latest` - Get latest articles
- `GET /api/articles/:id` - Get article by ID
- `GET /api/articles/search?q=...` - Search articles
- `GET /api/articles/stats` - Get statistics
- `GET /api/articles/tags` - Get all tags
- `GET /health` - Health check

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ArticleList.jsx
│   │   ├── ArticleDetail.jsx
│   │   ├── Search.jsx
│   │   └── Stats.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

