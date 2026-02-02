# Registration Validation Improvements

## Summary

Enhanced the registration endpoint to properly validate email and phone number availability with clear, user-friendly error messages.

---

## Changes Made

### 1. Enhanced Email Validation
- ✅ Validates email format using regex
- ✅ Checks email in **Customer** table
- ✅ Checks email in **User** table (for legacy users)
- ✅ Provides clear error message: "This email is already registered. Please use a different email or try logging in."

### 2. Enhanced Phone Number Validation
- ✅ Checks phone number in **Customer** table
- ✅ Checks phone number in **User** table (for legacy users)
- ✅ Provides clear error message: "This phone number is already registered. Please use a different phone number or try logging in."

### 3. Separate Validation Checks
- ✅ Email and phone are checked **separately** (not combined in OR query)
- ✅ Each check provides **specific error messages**
- ✅ Prevents ambiguous error messages

---

## Endpoint

**POST** `/api/v1/auth/register`

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "password": "SecurePassword123!"
}
```

**Note:** At least one of `email` or `phone_number` is required.

---

## Validation Flow

1. **Check if email or phone is provided**
   - Error: `"Either email or phone_number is required"`

2. **Validate email format (if provided)**
   - Error: `"Invalid email format"`

3. **Check email availability (if provided)**
   - Checks Customer table
   - Checks User table (legacy)
   - Error: `"This email is already registered. Please use a different email or try logging in."`

4. **Check phone availability (if provided)**
   - Checks Customer table
   - Checks User table (legacy)
   - Error: `"This phone number is already registered. Please use a different phone number or try logging in."`

5. **Create new customer** (if all validations pass)

---

## Error Responses

### 400 Bad Request - Missing Required Fields
```json
{
  "statusCode": 400,
  "message": "Either email or phone_number is required",
  "error": "Bad Request"
}
```

### 400 Bad Request - Invalid Email Format
```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

### 409 Conflict - Email Already Registered
```json
{
  "statusCode": 409,
  "message": "This email is already registered. Please use a different email or try logging in.",
  "error": "Conflict"
}
```

### 409 Conflict - Phone Number Already Registered
```json
{
  "statusCode": 409,
  "message": "This phone number is already registered. Please use a different phone number or try logging in.",
  "error": "Conflict"
}
```

---

## Success Response

### 201 Created
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "unique_id": "uuid-here",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+919876543210",
    "is_verified": true
  }
}
```

---

## Testing Examples

### Test 1: Register with Email Only
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Test 2: Register with Phone Only
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "phone_number": "+919876543210",
    "password": "SecurePassword123!"
  }'
```

### Test 3: Register with Both Email and Phone
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Johnson",
    "email": "bob@example.com",
    "phone_number": "+919876543211",
    "password": "SecurePassword123!"
  }'
```

### Test 4: Try to Register with Existing Email
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "existing@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 409,
  "message": "This email is already registered. Please use a different email or try logging in.",
  "error": "Conflict"
}
```

### Test 5: Try to Register with Existing Phone
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone_number": "+919876543210",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 409,
  "message": "This phone number is already registered. Please use a different phone number or try logging in.",
  "error": "Conflict"
}
```

### Test 6: Invalid Email Format
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

---

## Implementation Details

### Code Location
- **File:** `src/auth/auth.service.ts`
- **Method:** `register()`
- **Lines:** 836-939

### Key Improvements

1. **Separate Email Check:**
```typescript
if (email) {
  // Check Customer table
  const existingCustomerByEmail = await this.customerRepository.findOne({
    where: { email, is_deleted: false },
  });
  if (existingCustomerByEmail) {
    throw new ConflictException('This email is already registered...');
  }

  // Check User table (legacy)
  const existingUserByEmail = await this.userRepository.findOne({
    where: { email, is_deleted: false },
  });
  if (existingUserByEmail) {
    throw new ConflictException('This email is already registered...');
  }
}
```

2. **Separate Phone Check:**
```typescript
if (phone_number) {
  // Check Customer table
  const existingCustomerByPhone = await this.customerRepository.findOne({
    where: { phone_number, is_deleted: false },
  });
  if (existingCustomerByPhone) {
    throw new ConflictException('This phone number is already registered...');
  }

  // Check User table (legacy)
  const existingUserByPhone = await this.userRepository.findOne({
    where: { phone_number, is_deleted: false },
  });
  if (existingUserByPhone) {
    throw new ConflictException('This phone number is already registered...');
  }
}
```

3. **Email Format Validation:**
```typescript
if (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestException('Invalid email format');
  }
}
```

---

## Benefits

1. ✅ **Clear Error Messages** - Users know exactly what went wrong
2. ✅ **Separate Validation** - Email and phone checked independently
3. ✅ **Comprehensive Checks** - Checks both Customer and User tables
4. ✅ **Better UX** - Suggests trying to log in if already registered
5. ✅ **Format Validation** - Catches invalid email formats early

---

## Notes

- The DTO already has `@IsEmail()` validation, but we added an extra check in the service for safety
- Both Customer and User tables are checked to handle legacy users
- Error messages are user-friendly and actionable
- All validations happen before any database writes

