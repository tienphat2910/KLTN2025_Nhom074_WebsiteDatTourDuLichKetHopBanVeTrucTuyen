export const env = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "LuTrip"
};

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "Warning: NEXT_PUBLIC_API_BASE_URL is not set, using default localhost:5000"
  );
}

export default env;
