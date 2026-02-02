# Swagger Request Body Documentation Fix

## ✅ Implementation Complete

### Overview
Fixed missing request body documentation in Swagger for multiple API endpoints. Many endpoints were using inline types or `Partial<User>` instead of proper DTOs with `@ApiProperty` decorators, causing Swagger to show "No parameters" instead of the request body schema.

## Fixed Endpoints

### 1. **Users - Update Profile (App)**
- **Endpoint**: `PUT /api/v1/app/users/profile`
- **Issue**: Used `Partial<User>` instead of DTO
- **Fix**: 
  - Changed to use `UpdateCustomerProfileDto`
  - Added `@ApiBody` decorator with examples
  - Added `@ApiResponse` decorators

### 2. **Users - Update Profile (Web)**
- **Endpoint**: `PUT /api/v1/web/users/me`
- **Issue**: Used `Partial<User>` instead of DTO
- **Fix**: 
  - Changed to use `UpdateCustomerProfileDto`
  - Added `@ApiBody` decorator

### 3. **Customer - Update Profile**
- **Endpoint**: `PUT /api/v1/customer/profile`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator with examples

### 4. **Manifestation - Create**
- **Endpoint**: `POST /api/v1/app/manifestation/add`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator with multiple examples (career, relationship, money)

### 5. **Manifestation - Calculate Resonance**
- **Endpoint**: `POST /api/v1/app/manifestation/calculate-resonance`
- **Issue**: Used inline type `{ description: string }` instead of DTO
- **Fix**: 
  - Created `CalculateResonanceDto`
  - Added `@ApiBody` decorator with examples

### 6. **Manifestation - Add Alignment Actions**
- **Endpoint**: `POST /api/v1/app/manifestation/alignment-actions/add`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator with example

### 7. **Manifestation - Commit Intention**
- **Endpoint**: `POST /api/v1/app/manifestation/commit`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator with examples

### 8. **Kundli - Generate (Public)**
- **Endpoint**: `POST /api/v1/kundli`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator with example

### 9. **Kundli - Generate (Authenticated)**
- **Endpoint**: `POST /api/v1/kundli/authenticated`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator

### 10. **Kundli - Generate PDF**
- **Endpoint**: `POST /api/v1/kundli/pdf`
- **Issue**: Missing `@ApiBody` decorator
- **Fix**: 
  - Added `@ApiBody` decorator

### 11. **Karma - Add Input**
- **Endpoint**: `POST /api/v1/app/karma/input`
- **Issue**: Used inline type `{ action_text: string; timestamp?: string }` instead of DTO
- **Fix**: 
  - Created `AddKarmaInputDto`
  - Added `@ApiBody` decorator with example

## New DTOs Created

### 1. `CalculateResonanceDto`
**Location**: `ib_backend/src/manifestation/dtos/calculate-resonance.dto.ts`
```typescript
export class CalculateResonanceDto {
  @ApiProperty({
    example: 'I want to find a fulfilling job...',
    description: 'Manifestation description text for resonance calculation',
    minLength: 15,
  })
  description: string;
}
```

### 2. `AddKarmaInputDto`
**Location**: `ib_backend/src/karma/dtos/add-karma-input.dto.ts`
```typescript
export class AddKarmaInputDto {
  @ApiProperty({
    example: 'Helped an elderly person cross the road',
    description: 'Description of the karma action performed',
  })
  action_text: string;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00Z',
    description: 'Optional timestamp for when the action was performed',
  })
  timestamp?: string;
}
```

## Changes Made

### Controllers Updated
1. `ib_backend/src/users/controllers/app/app-users.controller.ts`
2. `ib_backend/src/users/controllers/web/web-users.controller.ts`
3. `ib_backend/src/controllers/customer/customer.controller.ts`
4. `ib_backend/src/manifestation/controllers/app-manifestation.controller.ts`
5. `ib_backend/src/kundli/controllers/kundli.controller.ts`
6. `ib_backend/src/karma/controllers/app-karma.controller.ts`

### Key Improvements
1. **Proper DTOs**: Replaced inline types and `Partial<User>` with proper DTO classes
2. **@ApiBody Decorators**: Added to all POST/PUT endpoints that accept request bodies
3. **Examples**: Added example values in `@ApiBody` decorators for better documentation
4. **Response Documentation**: Added `@ApiResponse` decorators where missing
5. **Type Safety**: Improved type safety by using DTOs instead of inline types

## Before vs After

### Before
```typescript
@Put('profile')
@ApiOperation({ summary: 'Update profile (Mobile App)' })
async updateProfile(
  @CurrentUser() user: any,
  @Body() updateData: Partial<User>, // ❌ No Swagger documentation
) {
  // ...
}
```

**Swagger UI**: Shows "No parameters"

### After
```typescript
@Put('profile')
@ApiOperation({ summary: 'Update profile (Mobile App)' })
@ApiBody({ 
  type: UpdateCustomerProfileDto,
  description: 'Profile update data. All fields are optional.',
  examples: {
    basic: {
      summary: 'Basic profile update',
      value: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
    },
  },
})
@ApiResponse({ status: 200, description: 'Profile updated successfully' })
async updateProfile(
  @CurrentUser() user: any,
  @Body() updateData: UpdateCustomerProfileDto, // ✅ Proper DTO with Swagger docs
) {
  // ...
}
```

**Swagger UI**: Shows full request body schema with examples

## Benefits

1. **Better Documentation**: All endpoints now show request body schemas in Swagger
2. **Easier Testing**: Developers can see example values and test directly from Swagger UI
3. **Type Safety**: Using DTOs instead of inline types improves type checking
4. **Consistency**: All endpoints follow the same pattern for request body documentation
5. **Developer Experience**: Clear examples help developers understand what data to send

## Testing

After these changes, all endpoints should now display:
- ✅ Request body schema
- ✅ Field descriptions
- ✅ Example values
- ✅ Required/optional indicators
- ✅ Data types and constraints

## Next Steps

1. ✅ All major endpoints fixed
2. ⏳ Review other controllers for similar issues
3. ⏳ Add examples to remaining endpoints if needed
4. ⏳ Consider adding response examples for better documentation




