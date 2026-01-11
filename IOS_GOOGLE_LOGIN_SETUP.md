# iOS Google Login Setup - API is Ready! ✅

## Current Status

Your NestJS API endpoint `/api/v1/app/auth/google` **already supports iOS** (and Android). The implementation is complete and working.

## API Endpoint

**Endpoint:** `POST /api/v1/app/auth/google`

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      ...
    }
  }
}
```

## What's Already Working

✅ **Endpoint:** `/api/v1/app/auth/google` - Ready for iOS  
✅ **Token Verification:** Supports multiple client IDs (Web, iOS, Android)  
✅ **User Creation:** Automatically creates user if doesn't exist  
✅ **Token Generation:** Returns access_token and refresh_token  
✅ **Response Format:** Consistent app response format

## Configuration for iOS

### Step 1: Get iOS Client ID from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **iOS**
6. Bundle ID: Your iOS app bundle ID (e.g., `com.yourapp.ibhakt`)
7. Copy the **Client ID**

### Step 2: Update Backend `.env`

Add the iOS Client ID to your existing `GOOGLE_CLIENT_ID` (comma-separated):

```env
# Current (Web only - working)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com

# Updated (Web + iOS)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com,YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

### Step 3: Restart Backend

```bash
npm run start:dev
```

## How It Works

1. **iOS App** gets ID token from Google Sign-In
2. **iOS App** sends `POST /api/v1/app/auth/google` with `{ "id_token": "..." }`
3. **Backend** tries to verify token against all configured client IDs
4. **Backend** finds matching iOS client ID and verifies token
5. **Backend** returns access_token, refresh_token, and user data

## Testing

### Test with curl:
```bash
curl -X POST http://localhost:3000/api/v1/app/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "IOS_ID_TOKEN_FROM_GOOGLE"}'
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { ... }
  }
}
```

## Flutter iOS Code

Your Flutter app just needs to:

1. Get ID token from Google Sign-In (iOS)
2. Call the API:

```dart
final result = await loginWithGoogle(idToken);
// result contains: access_token, refresh_token, user
```

The API endpoint is the same for Web, iOS, and Android!

## Summary

✅ **API is ready** - No code changes needed  
✅ **Just add iOS Client ID** to `.env` file  
✅ **Same endpoint** works for Web, iOS, and Android  
✅ **Automatic token verification** against all configured client IDs

Your API already handles iOS tokens - just configure the iOS Client ID in your `.env` file!



