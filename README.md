# IP Geolocation Backend

This is the backend service for the IP Geolocation application, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js 18.x or higher
- MongoDB Atlas account or local MongoDB instance
- Vercel account (for deployment)

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
IP_GEOLOCATION_API_KEY=your_api_key_here
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The server will be available at `http://localhost:5000`

## Deployment

This application is configured for deployment on Vercel:

1. Push your code to a Git repository
2. Import the project into Vercel
3. Add the required environment variables in the Vercel dashboard
4. Deploy!

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/geo` - Get geolocation data
- `GET /api/history` - Get search history
- `POST /api/history` - Save search history

## Production Notes

- Ensure `NODE_ENV` is set to `production` in production
- Use HTTPS in production
- Set appropriate CORS origins in `ALLOWED_ORIGINS`
- Keep your JWT secret and database credentials secure
