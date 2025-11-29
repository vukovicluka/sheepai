# Docker Compose Quick Start

## Start MongoDB

```bash
docker-compose up -d
```

This command will:
- Pull the MongoDB 7.0 image (if not already downloaded)
- Create a container named `hacker-news-mongodb`
- Start MongoDB on port 27017
- Create persistent volumes for data storage

## Verify MongoDB is Running

```bash
docker-compose ps
```

You should see the container with status "Up".

## Check MongoDB Logs

```bash
docker-compose logs -f mongodb
```

## Stop MongoDB

```bash
docker-compose down
```

## Stop and Remove All Data

```bash
docker-compose down -v
```

⚠️ **Warning:** This will delete all your MongoDB data!

## Connection Details

- **Host:** localhost
- **Port:** 27017
- **Database:** hacker-news-scraper (will be created automatically)
- **Connection String:** `mongodb://localhost:27017/hacker-news-scraper`

## Troubleshooting

### Port Already in Use
If port 27017 is already in use:
```bash
# Find what's using the port
lsof -i :27017

# Or change the port in docker-compose.yml:
# ports:
#   - "27018:27017"  # Use 27018 on host instead
```

### Container Won't Start
```bash
# Check logs
docker-compose logs mongodb

# Restart the container
docker-compose restart mongodb
```

### Access MongoDB Shell
```bash
docker-compose exec mongodb mongosh
```

