# Redis Session Store Setup

This document explains how to set up and use Redis for session storage in local development.

## Quick Start

1. **Start Redis:**
   ```bash
   docker-compose up -d
   ```

2. **Verify Redis is running:**
   ```bash
   docker exec laa-civil-cases-redis redis-cli ping
   ```
   Expected output: `PONG`

3. **Access Redis Dashboard:**
   - Open http://localhost:8081 in your browser
   - Redis Commander provides a lightweight web-based UI to view and manage Redis data
   - Look for keys with prefix `laa-civil-cases:` for session data
   - No login required for local development

4. **Configure environment variables in `.env`:**
   ```bash
   REDIS_ENABLED=true
   REDIS_URL=redis://localhost:6379
   ```

4. **Start the application:**
   ```bash
   yarn dev
   ```

## Useful Commands

### Check Redis container status
```bash
docker-compose ps
```

### View Redis logs
```bash
docker-compose logs redis
```

### Stop Redis
```bash
docker-compose down
```

### Connect to Redis CLI
```bash
docker exec -it laa-civil-cases-redis redis-cli
```

### Access Redis Commander (Web UI)
- **URL:** http://localhost:8081
- Browse and search keys visually
- View key details, TTL, type, and size
- Execute Redis commands through the UI
- Export/import data
- Simple, lightweight interface - no disk space required

### Monitor Redis commands (useful for debugging)
```bash
docker exec -it laa-civil-cases-redis redis-cli MONITOR
```

## Redis CLI Commands

Once connected to Redis CLI, you can use these commands:

- `KEYS *` - List all keys (use with caution in production)
- `KEYS laa-civil-cases:*` - List all session keys
- `GET <key>` - Get value of a key
- `TTL <key>` - Check time-to-live of a key
- `FLUSHALL` - Clear all keys (useful for testing)
- `INFO` - View Redis server information

## Testing Session Persistence

1. Start the application with Redis enabled
2. Log in and create a session
3. Check Redis for session data:
   ```bash
   docker exec laa-civil-cases-redis redis-cli KEYS "laa-civil-cases:*"
   ```
4. Restart the application (keep Redis running)
5. Verify your session persists without re-login

## Troubleshooting

### Redis won't start
- Check Docker is running: `docker ps`
- Check disk space: `df -h`
- View logs: `docker-compose logs redis`

### Application can't connect to Redis
- Verify Redis is running: `docker-compose ps`
- Check Redis URL in `.env`: should be `redis://localhost:6379`
- Ensure `REDIS_ENABLED=true` in `.env`

### Local Redis conflicts
If you have Redis installed locally (via Homebrew), it may conflict with Docker Redis:
```bash
# Stop local Redis
brew services stop redis
# Or kill it directly
sudo killall redis-server
```

The app should connect to Docker Redis at `localhost:6379`, not a local Redis instance.

### Sessions not persisting
- Verify Redis is enabled in application logs (look for "Using Redis session store")
- Check Redis has session data: `docker exec laa-civil-cases-redis redis-cli KEYS "*"`
- Verify session TTL: `docker exec laa-civil-cases-redis redis-cli TTL <session-key>`

## Disabling Redis

To use in-memory sessions (not recommended for multi-pod deployments):

```bash
# In .env file
REDIS_ENABLED=false
```

The application will automatically fall back to in-memory session storage.

## Production Considerations

⚠️ **Warning:** This docker-compose setup is for **local development only**.

For production deployments:
- follow https://user-guide.cloud-platform.service.justice.gov.uk/documentation/deploying-an-app/redis/create.html#creating-a-redis-cluster