# Migration to cst_customer Table - Complete Guide

## Overview

This document outlines the migration from the legacy `users` table to `cst_customer` as the **single source of truth** for both app and web authentication and user management.

## Why Migrate?

1. **cst_customer is the main table** - Contains all login details (phone, email, Google OAuth)
2. **Unified authentication** - Supports both app and web users
3. **Google login support** - Already integrated in cst_customer
4. **Simplified architecture** - One table instead of two
5. **Better maintainability** - Single source of truth

## Changes Made

### 1. Entity Updates

All entities that previously referenced `User` now reference `Customer`:

#### ✅ Updated Entities:
- **Kundli** (`kundli.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`
  - Note: Column name `user_id` kept for backward compatibility

- **Subscription** (`subscription.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

- **Order** (`order.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

- **ManifestationLog** (`manifestation-log.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

- **UsageTracking** (`usage-tracking.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

- **Payment** (`payment.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

- **Notification** (`notification.entity.ts`)
  - Changed: `@ManyToOne(() => User)` → `@ManyToOne(() => Customer)`
  - Property: `user: User` → `customer: Customer`

### 2. Service Updates

#### ✅ KundliService (`kundli.service.ts`)
- **Removed:** User repository injection and User record creation logic
- **Updated:** `saveKundliToDatabase` now uses Customer directly
- **Before:** Created User records for customers (workaround)
- **After:** Uses Customer ID directly - no User record needed

```typescript
// Before (workaround):
const customer = await this.customerRepository.findOne(...);
if (customer) {
  // Create User record for foreign key constraint
  user = this.userRepository.create({...});
  user = await this.userRepository.save(user);
  resolvedUserId = user.id;
}

// After (direct):
const customer = await this.customerRepository.findOne(...);
if (!customer) {
  throw new BadRequestException(`Customer with ID ${userId} not found`);
}
const resolvedUserId = customer.id; // Use directly
```

### 3. Customer Entity Updates

#### ✅ Enabled Relationships
- Uncommented `@OneToMany` relationships for:
  - `subscriptions: Subscription[]`
  - `orders: Order[]`
  - `kundlis: Kundli[]`
  - `manifestation_logs: ManifestationLog[]`

## Database Migration Required

### Foreign Key Constraints Update

The database foreign key constraints need to be updated to reference `cst_customer` instead of `users`:

```sql
-- Example for kundli table
ALTER TABLE kundli 
DROP CONSTRAINT IF EXISTS fk_kundli_user;

ALTER TABLE kundli 
ADD CONSTRAINT fk_kundli_customer 
FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- Repeat for all tables:
-- subscriptions, orders, manifestation_logs, usage_tracking, payments, notifications
```

### Migration Script

```sql
-- 1. Update kundli table
ALTER TABLE kundli DROP CONSTRAINT IF EXISTS fk_kundli_user;
ALTER TABLE kundli ADD CONSTRAINT fk_kundli_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 2. Update subscriptions table
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscription_user;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscription_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 3. Update orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_order_user;
ALTER TABLE orders ADD CONSTRAINT fk_order_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 4. Update manifestation_logs table
ALTER TABLE manifestation_logs DROP CONSTRAINT IF EXISTS fk_manifestation_log_user;
ALTER TABLE manifestation_logs ADD CONSTRAINT fk_manifestation_log_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 5. Update usage_tracking table
ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS fk_usage_tracking_user;
ALTER TABLE usage_tracking ADD CONSTRAINT fk_usage_tracking_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 6. Update payments table
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payment_user;
ALTER TABLE payments ADD CONSTRAINT fk_payment_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;

-- 7. Update notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notification_user;
ALTER TABLE notifications ADD CONSTRAINT fk_notification_customer 
  FOREIGN KEY (user_id) REFERENCES cst_customer(id) ON DELETE CASCADE;
```

## Remaining Tasks

### 1. Update AuthService
- Ensure all login methods (phone, email, Google) create/update Customer records
- Remove User record creation logic

### 2. Update Controllers
- Ensure all controllers use Customer service
- Remove User fallback logic

### 3. Update Other Services
- ManifestationEnhancedService - Already supports Customer
- SubscriptionsService - Update to use Customer
- OrdersService - Update to use Customer
- All other services referencing User

### 4. Update BaseEntity
- `added_by` and `modify_by` should reference Customer instead of User

### 5. Data Migration (Optional)
- Migrate existing User records to Customer table
- Map user_id in related tables to customer_id

## Benefits

1. ✅ **Single Source of Truth** - One table for all users
2. ✅ **Simplified Code** - No more dual User/Customer logic
3. ✅ **Better Performance** - No need to check both tables
4. ✅ **Easier Maintenance** - One table to manage
5. ✅ **Google Login Ready** - Already integrated
6. ✅ **Unified Authentication** - Same table for app and web

## Backward Compatibility

- Column names (`user_id`) are kept for backward compatibility
- Database migration can be done without breaking existing data
- TypeORM relationships updated but column names remain the same

## Testing Checklist

- [ ] Kundli creation for customers
- [ ] Subscription creation for customers
- [ ] Order creation for customers
- [ ] Manifestation creation for customers
- [ ] Google login creates Customer record
- [ ] Phone/Email login creates Customer record
- [ ] Profile updates work for customers
- [ ] All foreign key relationships work correctly

## Notes

- The `users` table can be deprecated after full migration
- All new users should be created in `cst_customer`
- Legacy User records can be migrated to Customer if needed
- Foreign key column names (`user_id`) are kept for compatibility but now reference `cst_customer.id`


