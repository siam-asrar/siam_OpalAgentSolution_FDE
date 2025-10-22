# Marketing Content Hub Connector - Final (OAuth-ready)

This bundle includes an OAuth-ready Express server for CMS + social posting tools, a Vercel serverless example, Docker/Docker-compose setup, Postman collection, Opal agent JSON exports, and tool registry JSON for Opal discovery.

## Quick start (local)
1. cd server
2. npm install
3. create .env with TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET (if using Twitter), and/or MASTODON_BASE_URL, MASTODON_ACCESS_TOKEN
4. npm start
5. ngrok http 8000

Register https://<ngrok-url>/api/discovery in Opal Tools Registry.

## Vercel
The `/vercel/api` folder contains a serverless discovery and a sample schedule-social-post endpoint ready for deployment via Vercel.

