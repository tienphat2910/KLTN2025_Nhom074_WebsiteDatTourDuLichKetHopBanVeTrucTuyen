export const env = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "LuTrip"
};

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn("Warning: NEXT_PUBLIC_API_BASE_URL is not set");
}

export default env;
