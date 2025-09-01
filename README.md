# Festify API

NestJS API for Spotify Web API integration. Allows Spotify authentication and fetching user's top artists/tracks.

## How to Run

### 1. Clone the repository
```bash
git clone https://github.com/williamosilva/festify-api
cd festify-api
```

### 2. Configure environment variables
Create a `.env` file:

```env
# Spotify (required)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
CALLBACK_URL=http://localhost:3001/auth/spotify/callback

# Database (required)
MONGO_URI=mongodb://localhost:27017/spotify-app

# URLs (required)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Optional
PORT=3001
NODE_ENV=development
BUILD_TARGET=development
```

### 3. Run with Docker (Recommended)
```bash
docker-compose up --build
```

**OR** run with Node.js:
```bash
npm install
npm run start:dev
```

API will be available at: http://localhost:3001

## Endpoints

### Authentication
- `GET /auth/spotify` - Redirects to Spotify OAuth authorization
- `GET /auth/spotify/callback` - OAuth callback, redirects to frontend with tokens
- `POST /auth/validate-token` - Validate access token
- `POST /auth/logout` - Logout and invalidate tokens

### Spotify Data
- `GET /spotify/top/:type` - Get top artists or tracks (type: `artists` or `tracks`)
- `GET /spotify/top/artists` - Get user's top artists
- `GET /spotify/top/tracks` - Get user's top tracks  
- `GET /spotify/top/artists/processed` - Get artists distributed in 3 balanced lists
- `DELETE /spotify/cache` - Clear user's cached data

### Query Parameters
All Spotify endpoints support these optional parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `time_range` | `short_term`, `medium_term`, `long_term` | `medium_term` | Time period for data |
| `limit` | `1-50` | `39` | Number of items to return |
| `offset` | `0+` | `0` | Starting index for pagination |

**Time Range Options:**
- `short_term` - Last 4 weeks
- `medium_term` - Last 6 months  
- `long_term` - Several years of data

### Authentication
Protected endpoints require the header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Response Examples

### Authentication Responses

**POST /auth/validate-token**

Request:
```json
{
  "accessToken": "BQC4YW9tYXRpYzEyM..."
}
```

Valid token response:
```json
{
  "statusCode": 200,
  "message": "Token is valid",
  "data": {
    "isValid": true,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "spotifyId": "spotify_user_123",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profileImageUrl": "https://i.scdn.co/image/..."
    }
  }
}
```

Token refresh response (when token expired but refresh successful):
```json
{
  "statusCode": 200,
  "message": "Token is valid",
  "data": {
    "isValid": true,
    "newAccessToken": "BQC4YW9tYXRpYzEyM...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "spotifyId": "spotify_user_123",
      "displayName": "John Doe",
      "email": "john@example.com",
      "profileImageUrl": "https://i.scdn.co/image/..."
    }
  }
}
```

Invalid token response:
```json
{
  "statusCode": 401,
  "message": "User not found",
  "data": {
    "isValid": false,
    "error": "User not found"
  }
}
```

**POST /auth/logout**

Request:
```json
{
  "accessToken": "BQC4YW9tYXRpYzEyM..."
}
```

Response:
```json
{
  "statusCode": 200,
  "message": "Logout successful"
}
```

### Top Artists Response
```json
{
  "href": "https://api.spotify.com/v1/me/top/artists",
  "items": [
    {
      "id": "4q3ewBCX7sLwd24euuV69X",
      "name": "Bad Bunny",
      "popularity": 100,
      "genres": ["reggaeton", "trap latino"],
      "images": [
        {
          "url": "https://i.scdn.co/image/...",
          "height": 640,
          "width": 640
        }
      ],
      "followers": {
        "total": 8000000
      },
      "external_urls": {
        "spotify": "https://open.spotify.com/artist/..."
      }
    }
  ],
  "limit": 20,
  "offset": 0,
  "total": 50
}
```

### Processed Artists Response
```json
{
  "lists": [
    {
      "id": 1,
      "artists": [
        {
          "name": "Bad Bunny",
          "popularity": 100
        },
        {
          "name": "Drake",
          "popularity": 95
        }
      ],
      "averagePopularity": 97
    }
  ],
  "originalTotal": 39,
  "processedAt": "2025-01-01T12:00:00Z"
}
```

## Usage Examples

### Authentication Flow
```bash
# 1. Start OAuth flow (redirects to Spotify)
curl http://localhost:3001/auth/spotify

# 2. After user authorizes, callback redirects to:
# http://localhost:3000/login-success?access=TOKEN&refresh=REFRESH_TOKEN

# 3. Validate token
curl -X POST -H "Content-Type: application/json" \
     -d '{"accessToken":"YOUR_TOKEN"}' \
     http://localhost:3001/auth/validate-token

# 4. Logout
curl -X POST -H "Content-Type: application/json" \
     -d '{"accessToken":"YOUR_TOKEN"}' \
     http://localhost:3001/auth/logout
```

### Spotify Data
```bash
# Get top artists for last 4 weeks
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3001/spotify/top/artists?time_range=short_term&limit=20"

# Get top tracks
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3001/spotify/top/tracks?limit=10"

# Get processed artists (distributed in 3 lists)
curl -H "Authorization: Bearer TOKEN" \
     "http://localhost:3001/spotify/top/artists/processed"

# Clear user cache
curl -X DELETE -H "Authorization: Bearer TOKEN" \
     http://localhost:3001/spotify/cache
```

## Frontend (Optional)
For the complete interface, also clone:
```bash
git clone https://github.com/williamosilva/festify-frontend
cd festify-frontend
npm install && npm run dev
```

## Requirements
- Node.js 20+ (if not using Docker)
- MongoDB running
- Spotify Developer account

## Author

**William Silva**  
[GitHub](https://github.com/williamosilva)