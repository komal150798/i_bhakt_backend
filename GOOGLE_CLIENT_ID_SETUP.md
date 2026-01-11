# Google Client ID Configuration for Multi-Platform Support

## Overview

Your NestJS backend now supports **multiple Google OAuth Client IDs** for:
- ✅ Web (React)
- ✅ iOS (Flutter)
- ✅ Android (Flutter)

## Configuration

### Environment Variable Setup

In your `.env` file, you can now provide **multiple client IDs** separated by commas:

```env
# Single Client ID (works for Web only)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com

# Multiple Client IDs (Web, iOS, Android)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com,ANDROID_CLIENT_ID.apps.googleusercontent.com,IOS_CLIENT_ID.apps.googleusercontent.com
```

### How It Works

1. When a user logs in with Google (from any platform), the backend receives the ID token
2. The backend tries to verify the token against **each configured client ID**
3. If verification succeeds with any client ID, the login is successful
4. This allows the same API to handle tokens from Web, iOS, and Android

## Setup Steps

### Step 1: Get Client IDs from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**

#### For Web (Already configured):
- Type: **Web application**
- Client ID: `817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com`

#### For Android:
1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Android**
3. Package name: Your Flutter app package (e.g., `com.yourapp.ibhakt`)
4. SHA-1 certificate fingerprint: Your app's signing certificate
5. Copy the **Client ID**

#### For iOS:
1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **iOS**
3. Bundle ID: Your Flutter app bundle ID (e.g., `com.yourapp.ibhakt`)
4. Copy the **Client ID**

### Step 2: Update Backend `.env`

```env
# Add all client IDs (comma-separated, no spaces)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com,YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com,YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

### Step 3: Restart Backend

```bash
npm run start:dev
```

## Testing

### Test Web Login:
```bash
curl -X POST http://localhost:3000/api/v1/app/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "WEB_ID_TOKEN"}'
```

### Test Android Login:
```bash
curl -X POST http://localhost:3000/api/v1/app/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "ANDROID_ID_TOKEN"}'
```

### Test iOS Login:
```bash
curl -X POST http://localhost:3000/api/v1/app/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "IOS_ID_TOKEN"}'
```

## Code Changes

The `verifyGoogleToken` method in `auth.service.ts` now:
- ✅ Accepts multiple client IDs (comma-separated)
- ✅ Tries verification against each client ID
- ✅ Returns success if any client ID verification succeeds
- ✅ Logs which client ID was used for successful verification

## Benefits

1. **Single API Endpoint**: One endpoint handles all platforms
2. **Easy Management**: Add/remove platforms by updating `.env`
3. **Backward Compatible**: Still works with single client ID
4. **Secure**: Each platform has its own credentials

## Troubleshooting

### Error: "No valid Google OAuth client IDs configured"
- Check that `GOOGLE_CLIENT_ID` is set in `.env`
- Ensure client IDs are comma-separated (no spaces)

### Error: "Google token verification failed for all configured client IDs"
- Verify the ID token is valid and not expired
- Check that the client ID used to generate the token is in your `.env`
- Check backend logs to see which client IDs were tried

### Token works on one platform but not another
- Ensure both platform client IDs are in `GOOGLE_CLIENT_ID`
- Verify client IDs are correctly configured in Google Cloud Console

## Example `.env` Configuration

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
# ... other configs

# Google OAuth - Multiple Client IDs (Web, iOS, Android)
GOOGLE_CLIENT_ID=817437277788-9c8t12ed24rp6egolaj2n71svj4egdl2.apps.googleusercontent.com,123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com,987654321-zyxwvutsrqponmlkjihgfedcba987654.apps.googleusercontent.com
```

## Notes

- Client IDs are tried in the order they appear in `GOOGLE_CLIENT_ID`
- The first successful verification stops the process
- All client IDs must be from the same Google Cloud project
- Web client ID can work for mobile, but separate IDs are recommended for production



