# Update Profile API - Full Name Support

## Summary

The update profile API now supports `full_name` field which automatically splits into `first_name` and `last_name` fields.

**Behavior:**
- When `full_name` is provided, it splits on the first space
- First word → `first_name`
- Everything after first space → `last_name`
- If `full_name` is provided, individual `first_name`/`last_name` in the same request are ignored

---

## Available Endpoints

### 1. App Users (Mobile App)
**Endpoint:** `PUT /api/v1/app/users/profile`

### 2. Web Users (Web Application)
**Endpoint:** `PUT /api/v1/web/users/me`

### 3. Customer Profile
**Endpoint:** `PUT /api/v1/customer/profile`

---

## cURL Examples

### Example 1: Update with full_name (App Users)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "John Doe"
  }'
```

**Result:** `first_name` = "John", `last_name` = "Doe"

---

### Example 2: Update with full_name (Web Users)

```bash
curl -X PUT "http://localhost:3000/api/v1/web/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "Jane Smith"
  }'
```

**Result:** `first_name` = "Jane", `last_name` = "Smith"

---

### Example 3: Update with full_name (Customer Profile)

```bash
curl -X PUT "http://localhost:3000/api/v1/customer/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "Robert Johnson"
  }'
```

**Result:** `first_name` = "Robert", `last_name` = "Johnson"

---

### Example 4: Full name with multiple words

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "John Michael Doe"
  }'
```

**Result:** `first_name` = "John", `last_name` = "Michael Doe"

---

### Example 5: Full name with other fields

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "Sarah Williams",
    "email": "sarah.williams@example.com",
    "gender": "female",
    "date_of_birth": "1990-05-15"
  }'
```

---

### Example 6: Using first_name and last_name separately (traditional way)

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Note:** If you provide both `full_name` and `first_name`/`last_name` in the same request, `full_name` takes precedence.

---

## Expected Response

### Success Response (App Users)
```json
{
  "success": true,
  "data": {
    "id": "user-unique-id-uuid",
    "name": "John Doe",
    "message": "Profile updated"
  }
}
```

### Success Response (Web Users)
```json
{
  "success": true,
  "data": {
    "unique_id": "user-unique-id-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "message": "Profile updated successfully"
  }
}
```

### Success Response (Customer Profile)
```json
{
  "success": true,
  "code": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": 123,
    "unique_id": "customer-unique-id-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with unique ID xxx not found"
}
```

---

## Testing with PowerShell (Windows)

```powershell
$token = "YOUR_ACCESS_TOKEN_HERE"
$body = @{
    full_name = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/app/users/profile" `
    -Method PUT `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $body
```

---

## Testing with Postman

1. **Method:** PUT
2. **URL:** `http://localhost:3000/api/v1/app/users/profile`
3. **Headers:**
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
4. **Body (raw JSON):**
```json
{
  "full_name": "John Doe"
}
```

---

## Implementation Details

- **Helper Function:** `splitFullName()` in `src/common/utils/string.util.ts`
- **Service:** Updated `CustomerService.updateProfile()` to handle `full_name`
- **Controllers:** Updated `AppUsersController` and `WebUsersController` to handle `full_name` for User entities
- **DTO:** Updated `UpdateCustomerProfileDto` description

The splitting logic:
- Trims whitespace
- Finds first space
- Everything before first space → `first_name`
- Everything after first space → `last_name`
- If no space found, entire string → `first_name`, `last_name` = empty string

