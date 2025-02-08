# URL Shortener API with Analytics

This is a URL Shortener API that allows users to shorten URLs, redirect to the original URL, and view detailed analytics for each URL.  
It includes:

- **User Authentication** using Google Sign-In (Passport.js)
- **Short URL Creation** with custom aliases
- **Redirection** to the original URL while tracking clicks
- **Comprehensive Analytics** (per URL, topic-based, overall)
- **Rate Limiting** to prevent abuse
- **Caching** with Redis for performance
- **Dockerized** deployment

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Additional Notes](#additional-notes)

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd url-shortener
Install dependencies:

bash
Copy
Edit
npm install
Set up environment variables:

Create a .env file in the root directory and add:

env
Copy
Edit
PORT=3000
MONGO_URI=<your_mongo_uri>
JWT_SECRET=<your_jwt_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
CLIENT_URL=<your_client_url>  # e.g., http://localhost:3000
Ensure Redis is running:

Either locally or via a Redis Cloud instance.
Check your config/redis.js for connection details.
Configuration
MongoDB: Mongoose is used for data modeling.
Redis: Caching is handled by Redis using a custom CacheService.
Authentication: Implemented with Passport.js (Google OAuth).
Analytics: Click data is logged and aggregated using MongoDB aggregation.
Running the Application
Start the server:

bash
Copy
Edit
npm start
The server will run at http://localhost:3000.

API Endpoints
Authentication
Google Authentication
GET /api/auth/google – Redirects to Google for authentication.
GET /api/auth/google/callback – Handles Google callback and returns a JWT.
Logout
POST /api/auth/logout – Invalidates the JWT (using Redis blacklist).
URL Shortening
Create Short URL
POST /api/url/shorten
Body: { "originalUrl": "https://example.com" }
Response: { "originalUrl": "https://example.com", "shortUrl": "abc123", ... }
Redirect to Original URL
GET /api/url/r/:alias
Redirects to the original URL and logs the click.
Analytics
Get URL Analytics (Single URL)
GET /api/analytics/:alias
Get Topic-Based Analytics
GET /api/analytics/topic/:topic
Get Overall Analytics (User)
GET /api/analytics/overall
Testing
Use tools like Postman or Thunder Client to test endpoints.
Ensure you include the Authorization: Bearer <token> header for protected routes.

Additional Notes
Rate limiting is applied to prevent abuse.
The solution is Dockerized for easy deployment.
See the repository for detailed code and additional documentation.
php
Copy
Edit
