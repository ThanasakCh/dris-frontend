/**
 * Development Configuration
 * 
 * ⚠️ WARNING: Set DEV_MODE to false before deploying to production!
 * 
 * This file controls development-only features.
 * Consider adding this file to .gitignore if you want to keep local settings.
 */

// Set to true to enable mock user (bypass authentication)
// Set to false for production or when testing real authentication
export const DEV_MODE = true;

// Mock user data for development (id must be valid UUID format)
export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "นักพัฒนา",
  username: "developer",
  email: "dev@example.com",
  created_at: new Date().toISOString(),
  is_active: true,
};

// Mock token for development (used in API calls)
export const MOCK_TOKEN = "dev-mock-token-12345";
