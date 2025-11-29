# MongoDB Local Setup Guide

## Option 1: Docker Compose (Easiest - Recommended)

The project includes a `docker-compose.yml` file for easy MongoDB setup.

1. **Start MongoDB:**
```bash
docker-compose up -d
```

2. **Verify it's running:**
```bash
docker-compose ps
```

3. **View logs:**
```bash
docker-compose logs -f mongodb
```

4. **Stop MongoDB:**
```bash
docker-compose down
```

5. **Stop and remove data volumes:**
```bash
docker-compose down -v
```

The MongoDB container will:
- Run on port 27017
- Persist data in Docker volumes
- Automatically restart if it crashes
- Include health checks

**Connection string:** `mongodb://localhost:27017/hacker-news-scraper`

## Option 2: Install MongoDB Community Edition (macOS)

### Using Homebrew (Easiest Method)

1. **Install MongoDB via Homebrew:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

2. **Start MongoDB service:**
```bash
brew services start mongodb-community
```

3. **Verify MongoDB is running:**
```bash
brew services list
```
You should see `mongodb-community` with status `started`.

4. **Test the connection:**
```bash
mongosh
```
This opens the MongoDB shell. Type `exit` to quit.

### Manual Start/Stop (Alternative)

If you prefer to start MongoDB manually instead of as a service:

```bash
# Start MongoDB
mongod --config /opt/homebrew/etc/mongod.conf

# Or if installed in a different location:
mongod --config /usr/local/etc/mongod.conf

# Stop MongoDB (press Ctrl+C or find the process)
```

## Option 2: Using Docker (If you have Docker installed)

1. **Pull and run MongoDB container:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb-data:/data/db \
  mongo:latest
```

2. **Verify it's running:**
```bash
docker ps
```

3. **Stop MongoDB:**
```bash
docker stop mongodb
```

4. **Start MongoDB again:**
```bash
docker start mongodb
```

## Option 3: MongoDB Atlas (Cloud - No Local Installation)

If you prefer a cloud solution:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update your `.env` file with the Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hacker-news-scraper
```

## Verify Your Setup

Once MongoDB is running, test the connection:

```bash
# Using mongosh (MongoDB Shell)
mongosh mongodb://localhost:27017

# Or test from Node.js
node -e "import('mongoose').then(m => m.connect('mongodb://localhost:27017/test').then(() => console.log('Connected!')).catch(e => console.error(e)))"
```

## Default Connection String

For local MongoDB, use this in your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/hacker-news-scraper
```

This connects to:
- **Host**: localhost
- **Port**: 27017 (MongoDB default)
- **Database**: hacker-news-scraper (will be created automatically)

## Troubleshooting

### MongoDB won't start
- Check if port 27017 is already in use: `lsof -i :27017`
- Check MongoDB logs: `tail -f /opt/homebrew/var/log/mongodb/mongo.log` (or `/usr/local/var/log/mongodb/mongo.log`)

### Permission errors
- Make sure the data directory exists and has proper permissions
- Default data directory: `/opt/homebrew/var/mongodb` (or `/usr/local/var/mongodb`)

### Connection refused
- Verify MongoDB is running: `brew services list` or `docker ps`
- Check if firewall is blocking port 27017

## Next Steps

Once MongoDB is running:
1. Create your `.env` file with the connection string
2. Start your Node.js server: `npm start`
3. The server will automatically create the database and collections when it first connects

