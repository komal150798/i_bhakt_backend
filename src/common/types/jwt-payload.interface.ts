/**
 * JWT Payload interface for authenticated users
 */
export interface JwtPayload {
  sub: number; // User ID
  email?: string;
  phone_number?: string;
  role: string;
  type: 'user' | 'admin' | 'customer';
  iat?: number;
  exp?: number;
}

/**
 * Current User interface - what's available from @CurrentUser() decorator
 */
export interface CurrentUserPayload {
  id: number;
  unique_id?: string;
  email?: string;
  phone_number?: string;
  role: string;
  type: 'user' | 'admin' | 'customer';
}


