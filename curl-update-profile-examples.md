# Update Profile API - cURL Examples

## Base Information
- **Endpoint**: `PUT /api/v1/app/users/profile`
- **Base URL**: `http://localhost:3000` (or your server URL)
- **Authentication**: Required (Bearer Token)
- **Content-Type**: `application/json`

---

## 1. Basic Profile Update (Name Only)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "first_name": "John",
    "last_name": "Doe"
  }'
```

---

## 1a. Update with Full Name (Auto-split into first_name and last_name)

**Note**: When `full_name` is provided, it will be automatically split into `first_name` and `last_name`. The first word becomes `first_name`, and everything after the first space becomes `last_name`.

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "John Doe"
  }'
```

**Result**: `first_name` = "John", `last_name` = "Doe"

**Example with multiple words**:
```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "John Michael Doe"
  }'
```

**Result**: `first_name` = "John", `last_name` = "Michael Doe"

---

## 2. Update with Birth Data (For Kundli)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "time_of_birth": "10:30:00",
    "place_name": "Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "timezone": "Asia/Kolkata"
  }'
```

---

## 3. Update Email Only

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "email": "newemail@example.com"
  }'
```

---

## 4. Update Gender

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "gender": "male"
  }'
```

---

## 5. Update Avatar URL

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "avatar_url": "https://example.com/avatar.jpg"
  }'
```

---

## 6. Update with New App Fields

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "Jane Smith",
    "gender": "female",
    "life_role": "Entrepreneur",
    "relationship_status": "single",
    "interests": ["yoga", "meditation", "astrology"],
    "avatar_img": "https://example.com/avatar.jpg"
  }'
```

---

## 7. Complete Profile Update (All Fields)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "date_of_birth": "1995-05-20",
    "time_of_birth": "14:45:00",
    "place_name": "Delhi",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timezone": "Asia/Kolkata",
    "gender": "female",
    "life_role": "Teacher",
    "relationship_status": "married",
    "interests": ["reading", "travel", "cooking"],
    "avatar_img": "https://example.com/avatar.jpg"
  }'
```

---

## 8. Update with Minimal Data (Single Field)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "first_name": "UpdatedName"
  }'
```

---

## Expected Response (Success)

```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "user-unique-id-uuid",
    "name": "John Doe",
    "message": "Profile updated"
  }
}
```

---

## Error Responses

### 401 Unauthorized (Missing/Invalid Token)
```json
{
  "success": false,
  "code": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request (Invalid Data)
```json
{
  "success": false,
  "code": 400,
  "message": "Validation error message"
}
```

---

## Available Fields (All Optional)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `full_name` | string | Full name (will be split into first_name and last_name) | "John Doe" |
| `first_name` | string | First name | "John" |
| `last_name` | string | Last name | "Doe" |
| `email` | string | Email address | "john@example.com" |
| `date_of_birth` | string (YYYY-MM-DD) | Date of birth | "1990-01-15" |
| `time_of_birth` | string (HH:MM:SS) | Time of birth | "10:30:00" |
| `place_name` | string | Place of birth | "Mumbai" |
| `latitude` | number | Latitude (-90 to 90) | 19.0760 |
| `longitude` | number | Longitude (-180 to 180) | 72.8777 |
| `timezone` | string | Timezone | "Asia/Kolkata" |
| `gender` | string | Gender | "male" / "female" |
| `life_role` | string | Life role/profession | "Entrepreneur" |
| `relationship_status` | string | Relationship status | "single" / "married" |
| `interests` | array of strings | User interests | ["yoga", "meditation"] |
| `avatar_url` | string | Avatar image URL | "https://example.com/avatar.jpg" |
| `avatar_img` | string | Avatar image (alternative to avatar_url) | "https://example.com/avatar.jpg" |

---

## Quick Test Script

Save this as `test-update-profile.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api/v1"
TOKEN="YOUR_ACCESS_TOKEN_HERE"

# Test update
curl -X PUT "${BASE_URL}/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"
```

Make it executable:
```bash
chmod +x test-update-profile.sh
./test-update-profile.sh
```

---

## Available Endpoints

### App Users (Mobile App)
- **Endpoint**: `PUT /api/v1/app/users/profile`
- **Controller**: `AppUsersController`

### Web Users (Web Application)
- **Endpoint**: `PUT /api/v1/web/users/me`
- **Controller**: `WebUsersController`

### Customer Profile
- **Endpoint**: `PUT /api/v1/customer/profile`
- **Controller**: `CustomerController`

All endpoints support the same `UpdateCustomerProfileDto` with `full_name` splitting functionality.

---

## Notes

1. **All fields are optional** - You can update just one field or multiple fields
2. **Authentication required** - Must include valid Bearer token in Authorization header
3. **Date format** - Use `YYYY-MM-DD` for `date_of_birth`
4. **Time format** - Use `HH:MM:SS` for `time_of_birth`
5. **Coordinates** - Latitude must be between -90 and 90, Longitude between -180 and 180
6. **Timezone** - Use standard timezone names like "Asia/Kolkata", "America/New_York", etc.
7. **Full Name Splitting** - If `full_name` is provided, it will be automatically split into `first_name` and `last_name`:
   - The first word becomes `first_name`
   - Everything after the first space becomes `last_name`
   - Example: "John Doe" → `first_name: "John"`, `last_name: "Doe"`
   - Example: "John Michael Doe" → `first_name: "John"`, `last_name: "Michael Doe"`
   - If `full_name` is provided, individual `first_name` and `last_name` fields in the same request will be ignored
8. **Interests** - Should be sent as a JSON array. Empty array or null will clear interests. Example: `["yoga", "meditation"]`
9. **Avatar** - Both `avatar_url` and `avatar_img` are supported. Use whichever field name your app prefers.


