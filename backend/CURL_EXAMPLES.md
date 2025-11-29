# cURL Examples for Article API

## Base URL
```
http://localhost:3000
```

## Get All Articles

### Basic request (default pagination: page 1, limit 10)
```bash
curl http://localhost:3000/api/articles
```

### With pagination
```bash
curl "http://localhost:3000/api/articles?page=1&limit=20"
```

### With sorting
```bash
curl "http://localhost:3000/api/articles?sortBy=publishedDate&sortOrder=desc"
```

### Filter by category
```bash
curl "http://localhost:3000/api/articles?category=ransomware"
```

### Filter by tag
```bash
curl "http://localhost:3000/api/articles?tag=security"
```

### Filter by date range
```bash
curl "http://localhost:3000/api/articles?startDate=2024-01-01&endDate=2024-12-31"
```

### Combined filters (category + tag + pagination)
```bash
curl "http://localhost:3000/api/articles?page=1&limit=10&category=phishing&tag=security&sortBy=publishedDate&sortOrder=desc"
```

## Get Article by ID
```bash
curl http://localhost:3000/api/articles/ARTICLE_ID_HERE
```

## Get Latest Articles
```bash
curl "http://localhost:3000/api/articles/latest?limit=5"
```

### Latest articles by category
```bash
curl "http://localhost:3000/api/articles/latest?limit=5&category=ransomware"
```

## Search Articles
```bash
curl "http://localhost:3000/api/articles/search?q=cybersecurity"
```

### Search with pagination
```bash
curl "http://localhost:3000/api/articles/search?q=cybersecurity&page=1&limit=10"
```

### Search with category filter
```bash
curl "http://localhost:3000/api/articles/search?q=attack&category=phishing"
```

## Get Statistics
```bash
curl http://localhost:3000/api/articles/stats
```

### Statistics filtered by category
```bash
curl "http://localhost:3000/api/articles/stats?category=ransomware"
```

## Get All Tags
```bash
curl http://localhost:3000/api/articles/tags
```

## Health Check
```bash
curl http://localhost:3000/health
```

## Pretty Print JSON (using jq)

If you have `jq` installed, you can format the JSON output:

```bash
curl http://localhost:3000/api/articles | jq
```

## Examples with Headers

### Request with custom headers
```bash
curl -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/articles
```

### Verbose output (see request/response details)
```bash
curl -v http://localhost:3000/api/articles
```

## Save Response to File
```bash
curl http://localhost:3000/api/articles -o articles.json
```

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Health Check ==="
curl -s "$BASE_URL/health" | jq

echo -e "\n=== Get All Articles ==="
curl -s "$BASE_URL/api/articles?limit=5" | jq

echo -e "\n=== Get Latest Articles ==="
curl -s "$BASE_URL/api/articles/latest?limit=3" | jq

echo -e "\n=== Get Statistics ==="
curl -s "$BASE_URL/api/articles/stats" | jq

echo -e "\n=== Get Tags ==="
curl -s "$BASE_URL/api/articles/tags" | jq
```

Make it executable:
```bash
chmod +x test-api.sh
./test-api.sh
```

