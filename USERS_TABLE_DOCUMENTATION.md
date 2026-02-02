# Users Table Documentation

## Overview

The `users` table is a **legacy user management table** in the iBhakt application. It serves as the primary user entity for web-based authentication and is used as a foreign key reference by multiple core features of the application.

## Table Structure

### Entity: `User` (Table: `users`)

**Location:** `ib_backend/src/users/entities/user.entity.ts`

### Core Fields

#### Identity & Authentication
- `id` (BIGINT, Primary Key) - Auto-incrementing unique identifier
- `unique_id` (UUID) - Unique identifier for external references
- `email` (VARCHAR 100, Unique, Nullable) - User's email address
- `phone_number` (VARCHAR 20, Unique, Required) - User's phone number (primary identifier)
- `password` (VARCHAR 255, Nullable) - Hashed password for authentication
- `is_verified` (BOOLEAN, Default: false) - Email/phone verification status
- `last_login` (TIMESTAMP, Nullable) - Last login timestamp

#### Personal Information
- `first_name` (VARCHAR 100, Nullable)
- `last_name` (VARCHAR 100, Nullable)
- `gender` (VARCHAR 20, Nullable)
- `avatar_url` (TEXT, Nullable) - Profile picture URL

#### Birth Details (for Astrological Calculations)
- `date_of_birth` (DATE, Nullable)
- `time_of_birth` (TIME, Nullable)
- `place_name` (VARCHAR 255, Nullable)
- `latitude` (DECIMAL 10,7, Nullable)
- `longitude` (DECIMAL 10,7, Nullable)
- `timezone` (VARCHAR 100, Nullable)

#### Astrological Data
- `nakshatra` (VARCHAR 50, Nullable) - Birth star
- `pada` (SMALLINT, Nullable) - Nakshatra pada (quarter)
- `moon_longitude_deg` (DECIMAL 12,8, Nullable) - Moon's longitude at birth
- `dasha_at_birth` (VARCHAR 100, Nullable) - Current dasha period at birth

#### Account & Subscription
- `role` (ENUM: UserRole, Default: USER) - User role (USER, ADMIN, etc.)
- `current_plan` (ENUM: PlanType, Default: FREE) - Current subscription plan
- `referral_code` (VARCHAR 50, Unique, Nullable) - User's referral code
- `referred_by` (BIGINT, Nullable) - ID of user who referred this user

#### Base Entity Fields (Inherited)
- `added_date` (TIMESTAMPTZ) - Record creation timestamp
- `modify_date` (TIMESTAMPTZ) - Last modification timestamp
- `is_enabled` (BOOLEAN, Default: true) - Account active status
- `is_deleted` (BOOLEAN, Default: false) - Soft delete flag
- `added_by` (BIGINT, Nullable) - User who created this record
- `modify_by` (BIGINT, Nullable) - User who last modified this record

## Relationships (Foreign Keys)

The `users` table is referenced by the following tables through `user_id` foreign keys:

### 1. **Kundli** (`kundli` table)
- **Relationship:** One-to-Many (One User → Many Kundlis)
- **Foreign Key:** `kundli.user_id` → `users.id`
- **Cascade:** ON DELETE CASCADE
- **Purpose:** Stores user's birth chart and astrological data
- **Usage:** Kundli generation, dasha calculations, astrological analysis

### 2. **Subscription** (`subscriptions` table)
- **Relationship:** One-to-Many (One User → Many Subscriptions)
- **Foreign Key:** `subscriptions.user_id` → `users.id`
- **Cascade:** ON DELETE CASCADE
- **Purpose:** Tracks user's subscription plans and billing
- **Usage:** Plan management, subscription renewals, payment processing

### 3. **Order** (`orders` table)
- **Relationship:** One-to-Many (One User → Many Orders)
- **Foreign Key:** `orders.user_id` → `users.id`
- **Cascade:** ON DELETE CASCADE
- **Purpose:** Stores purchase orders and transactions
- **Usage:** Order processing, payment tracking, subscription purchases

### 4. **ManifestationLog** (`manifestation_logs` table)
- **Relationship:** One-to-Many (One User → Many Manifestation Logs)
- **Foreign Key:** `manifestation_logs.user_id` → `users.id`
- **Cascade:** ON DELETE CASCADE
- **Purpose:** Logs user's manifestation entries and analysis
- **Usage:** Manifestation tracking, AI analysis, probability calculations

### 5. **DashaRecord** (`dasha_records` table)
- **Relationship:** One-to-Many (One User → Many Dasha Records)
- **Foreign Key:** `dasha_records.user_id` → `users.id`
- **Cascade:** ON DELETE CASCADE
- **Purpose:** Stores Vimshottari dasha periods for users
- **Usage:** Dasha timeline calculations, period predictions

### 6. **UsageTracking** (`usage_tracking` table)
- **Relationship:** Indirect (through Subscription)
- **Purpose:** Tracks feature usage limits per subscription

### 7. **JournalEntry** (`journal_entries` table)
- **Relationship:** One-to-Many
- **Purpose:** Stores user's journal entries

### 8. **RefreshToken** (`refresh_tokens` table)
- **Relationship:** One-to-Many
- **Purpose:** Stores JWT refresh tokens for authentication

## Services Using User Entity

### 1. **AuthService** (`auth.service.ts`)
- **Purpose:** User authentication and registration
- **Operations:**
  - User registration (phone/email)
  - Login (phone/email/password)
  - Google OAuth login (creates User for legacy compatibility)
  - Token generation and refresh
  - Password reset

### 2. **UsersService** (`users.service.ts`)
- **Purpose:** User profile management
- **Operations:**
  - Create/update user profiles
  - Find users by ID, email, phone, unique_id
  - List users with pagination
  - User statistics and analytics

### 3. **KundliService** (`kundli.service.ts`)
- **Purpose:** Kundli generation and management
- **Operations:**
  - Generate kundli for users
  - Save kundli data linked to user_id
  - **Note:** Recently updated to handle both User and Customer entities

### 4. **ManifestationEnhancedService** (`manifestation-enhanced.service.ts`)
- **Purpose:** Manifestation analysis and scoring
- **Operations:**
  - Create manifestations for users
  - Validate kundli before manifestation
  - Generate AI-enhanced tips and insights
  - **Note:** Supports both User and Customer entities

### 5. **SubscriptionsService** (`subscriptions.service.ts`)
- **Purpose:** Subscription management
- **Operations:**
  - Create/update subscriptions
  - Check subscription status
  - Handle plan upgrades/downgrades

### 6. **JWT Strategy** (`jwt.strategy.ts`)
- **Purpose:** JWT token validation
- **Operations:**
  - Validate JWT tokens
  - Load user from database for authenticated requests

## Controllers Using User Entity

### 1. **WebUsersController** (`web-users.controller.ts`)
- **Endpoints:**
  - `GET /api/v1/web/users/profile` - Get user profile
  - `PUT /api/v1/web/users/profile` - Update user profile
  - `GET /api/v1/web/users/stats` - Get user statistics

### 2. **AppUsersController** (`app-users.controller.ts`)
- **Endpoints:**
  - `GET /api/v1/app/users/profile` - Get user profile
  - `PUT /api/v1/app/users/profile` - Update user profile
  - `GET /api/v1/app/users/stats` - Get user statistics
  - **Note:** Recently updated to support both User and Customer

### 3. **AdminUsersController** (`admin-users.controller.ts`)
- **Endpoints:**
  - `GET /api/v1/admin/users` - List all users
  - `GET /api/v1/admin/users/:id` - Get user details
  - `PUT /api/v1/admin/users/:id` - Update user
  - `DELETE /api/v1/admin/users/:id` - Delete user

## Key Differences: Users vs Customers

### Users Table (`users`)
- **Purpose:** Legacy web-based user management
- **Authentication:** Phone/Email + Password
- **Primary Use:** Web application users
- **Status:** Being phased out in favor of Customer table

### Customers Table (`cst_customer`)
- **Purpose:** Modern app-based user management
- **Authentication:** Phone/Email + Password, Google OAuth
- **Primary Use:** Mobile app users, Google login users
- **Status:** Current standard for new users

### Migration Strategy
- New users (especially Google login) are created in `cst_customer`
- Legacy users remain in `users` table
- Some services (like KundliService) now support both entities
- Controllers check both tables for backward compatibility

## Database Indexes

The `users` table has the following indexes for performance:

1. **Primary Index:** `id` (Primary Key)
2. **Unique Index:** `unique_id` (UUID)
3. **Unique Index:** `email` + `is_deleted` (Composite)
4. **Unique Index:** `phone_number` + `is_deleted` (Composite)
5. **Index:** `phone_number` (Single column)
6. **Index:** `email` + `is_deleted` (Composite)

## Important Notes

### 1. **Soft Delete Pattern**
- Uses `is_deleted` flag instead of hard deletes
- Foreign key relationships respect soft delete
- Queries should filter `is_deleted = false`

### 2. **Cascade Deletes**
- Most relationships use `ON DELETE CASCADE`
- Deleting a user will delete all related records (kundli, subscriptions, orders, etc.)
- Use soft delete (`is_deleted = true`) instead of hard delete

### 3. **User ID Resolution**
- Some services now check both `users` and `cst_customer` tables
- When a Customer creates a kundli, a corresponding User record may be auto-created
- This ensures foreign key constraints are satisfied

### 4. **Role-Based Access**
- `role` field determines user permissions
- Default role: `USER`
- Admin users are stored in separate `adm_users` table

## Usage Statistics

Based on codebase analysis, the `users` table is referenced in:
- **93 files** across the codebase
- **127 repository injections**
- **Multiple services** for core functionality
- **Critical for:** Authentication, Kundli, Subscriptions, Orders, Manifestations

## Future Considerations

1. **Migration Path:** Consider migrating all users to `cst_customer` table
2. **Unified Entity:** Create a unified user management system
3. **Foreign Key Updates:** Update foreign keys to support both User and Customer
4. **Deprecation:** Plan for deprecating `users` table after full migration

## Summary

The `users` table is a **critical legacy component** of the iBhakt application, serving as:
- Primary user identity store for web users
- Foreign key reference for multiple core features
- Authentication and authorization base
- Profile and subscription management hub

While the system is transitioning to the `cst_customer` table for new users, the `users` table remains essential for:
- Backward compatibility
- Existing user data
- Foreign key relationships
- Legacy web application support




