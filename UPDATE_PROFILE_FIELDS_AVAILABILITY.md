# Update Profile API - Field Availability

## Summary

**YES**, all the fields you mentioned are available in the update API for both **App** and **Web** endpoints.

---

## Field Availability

| Field | DTO | Customer Entity | User Entity | App Endpoint | Web Endpoint |
|-------|-----|----------------|-------------|--------------|--------------|
| `full_name` | ✅ | ✅ | ❌ (splits to first_name/last_name) | ✅ | ✅ |
| `gender` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `life_role` | ✅ | ✅ | ⚠️ (copied but not in schema) | ✅ | ✅ |
| `date_of_birth` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `time_of_birth` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `place_name` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `relationship_status` | ✅ | ✅ | ⚠️ (copied but not in schema) | ✅ | ✅ |
| `interests` | ✅ | ✅ | ⚠️ (copied but not in schema) | ✅ | ✅ |
| `avatar_img` | ✅ | ✅ | ⚠️ (copied but not in schema) | ✅ | ✅ |

---

## Endpoints

### App Users
- **Endpoint:** `PUT /api/v1/app/users/profile`
- **Controller:** `AppUsersController`
- **DTO:** `UpdateCustomerProfileDto`

### Web Users
- **Endpoint:** `PUT /api/v1/web/users/me`
- **Controller:** `WebUsersController`
- **DTO:** `UpdateCustomerProfileDto`

---

## Important Notes

### 1. Customer vs User Entities
- **Customer entities** (new users, Google logins): All fields are fully supported
- **User entities** (legacy users): Some fields like `life_role`, `relationship_status`, `interests`, and `avatar_img` are copied but may not be persisted if they don't exist in the database schema

### 2. Full Name Behavior
- When `full_name` is provided, it automatically splits into `first_name` and `last_name`
- First word → `first_name`
- Everything after first space → `last_name`
- Example: "John Doe" → `first_name: "John"`, `last_name: "Doe"`

### 3. Interests Field
- Should be sent as a JSON array: `["yoga", "meditation"]`
- Empty array or `null` will clear interests
- Stored as JSON string in Customer entity

### 4. Null Values
- All fields accept `null` to clear/reset values
- `time_of_birth` can be `null` if time is not sure

---

## Example Request Body

```json
{
  "full_name": "John Doe",
  "gender": "male",
  "life_role": "Entrepreneur",
  "date_of_birth": "1990-01-15",
  "time_of_birth": "10:30:00",
  "place_name": "Mumbai",
  "relationship_status": "single",
  "interests": ["yoga", "meditation", "astrology"],
  "avatar_img": "https://example.com/avatar.jpg"
}
```

---

## cURL Example

```bash
curl -X PUT "http://localhost:3000/api/v1/app/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "full_name": "John Doe",
    "gender": "male",
    "life_role": "Entrepreneur",
    "date_of_birth": "1990-01-15",
    "time_of_birth": "10:30:00",
    "place_name": "Mumbai",
    "relationship_status": "single",
    "interests": ["yoga", "meditation"],
    "avatar_img": "https://example.com/avatar.jpg"
  }'
```

---

## Response Example

### App Endpoint Response
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

### Web Endpoint Response
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

---

## Field Details

### full_name
- **Type:** string
- **Description:** Full name that will be split into first_name and last_name
- **Example:** "John Doe" → first_name: "John", last_name: "Doe"

### gender
- **Type:** string
- **Description:** Gender
- **Example:** "male", "female", "other"

### life_role
- **Type:** string
- **Description:** Life role/profession
- **Example:** "Entrepreneur", "Teacher", "Student"

### date_of_birth
- **Type:** string (YYYY-MM-DD)
- **Description:** Date of birth
- **Example:** "1990-01-15"

### time_of_birth
- **Type:** string (HH:MM:SS) or null
- **Description:** Time of birth (can be null if not sure)
- **Example:** "10:30:00" or null

### place_name
- **Type:** string
- **Description:** Place of birth
- **Example:** "Mumbai", "Delhi"

### relationship_status
- **Type:** string
- **Description:** Relationship status
- **Example:** "single", "married", "divorced"

### interests
- **Type:** array of strings or null
- **Description:** User interests (sent as JSON array)
- **Example:** ["yoga", "meditation", "astrology"] or null

### avatar_img
- **Type:** string
- **Description:** Avatar image URL
- **Example:** "https://example.com/avatar.jpg"

---

## Conclusion

✅ **All fields are available and supported** in both App and Web update endpoints. The API will accept all these fields and process them accordingly.

