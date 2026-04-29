import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Customer } from '../users/entities/customer.entity';
import { AdminUser } from '../users/entities/admin-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CustomerToken } from './entities/customer-token.entity';
import { AdminToken } from './entities/admin-token.entity';
import { OtpService } from './services/otp.service';

import { AuthJwtService } from './services/jwt.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '../common/enums/user-role.enum';
import { PlanType } from '../common/enums/plan-type.enum';
import { HoroscopeService } from '../horoscope/services/horoscope.service';
import { normalizePhoneNumber } from '../common/utils/string.util';
import { SubscriptionsService } from '../subscriptions/services/subscriptions.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(CustomerToken)
    private customerTokenRepository: Repository<CustomerToken>,
    @InjectRepository(AdminToken)
    private adminTokenRepository: Repository<AdminToken>,
    private otpService: OtpService,
    private jwtService: AuthJwtService,
    private configService: ConfigService,
    private horoscopeService: HoroscopeService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Get app session expiration from environment variable
   * Defaults to 90 days if not set
   */
  private getAppSessionExpiration(): string {
    const days = this.configService.get<number>('APP_SESSION_DAYS', 90);
    return `${days}d`;
  }

  async sendOtp(phoneNumber: string): Promise<{ message: string; debug_code?: string }> {
    // Normalize phone number before storing OTP
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const otpResult = await this.otpService.issueOtp(normalizedPhone, 'login');
    const response: { message: string; debug_code?: string } = {
      message: 'OTP sent successfully',
    };

    // In non-production, include debug code
    if (process.env.APP_ENV !== 'production') {
      response.debug_code = otpResult.otp_code;
    }

    // TODO: In production, send OTP via SMS service
    // await this.smsService.sendOtp(phoneNumber, otpResult.otp_code);

    return response;
  }

  async sendEmailOtp(email: string): Promise<{ message: string; debug_code?: string }> {
    const otpResult = await this.otpService.issueOtp(email, 'verify_email');
    const response: { message: string; debug_code?: string } = {
      message: 'OTP sent successfully to email',
    };

    // In non-production, include debug code
    if (process.env.APP_ENV !== 'production') {
      response.debug_code = otpResult.otp_code;
    }

    // TODO: In production, send OTP via email service
    // await this.emailService.sendOtp(email, otpResult.otp_code);
    
    return response;
  }

  async verifyOtp(phoneNumber: string, otpCode: string, isLogin: boolean = false): Promise<{
    success: boolean;
    access_token: string;
    refresh_token: string;
    user_id?: number;
  }> {
    // Normalize phone number before verification
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    if (!(await this.otpService.verifyOtp(normalizedPhone, otpCode))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check Customer table - pass original phoneNumber so all variations are tried
    const customer = await this.findCustomerByPhone(phoneNumber);

    // If login attempt, customer must exist
    if (isLogin && !customer) {
      throw new NotFoundException('User not found. Please register first or check your phone number.');
    }

    // Generate tokens with app session expiration
    const appSessionExpiration = this.getAppSessionExpiration();
    let userId: number | null = null;
    const role = UserRole.USER;

    if (customer) {
      // Use customer
      userId = customer.id;
      // Update last login
      customer.last_login = new Date();
      await this.customerRepository.save(customer);
    }
    // If customer doesn't exist and not login, userId remains null (for registration flow)

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId || 0,
      phone_number: customer?.phone_number || normalizedPhone,
      role: role,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
    const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);

    // Store refresh token if customer exists
    if (customer) {
      await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'otp');
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId || undefined,
    };
  }

  async verifyEmailOtp(email: string, otpCode: string, isLogin: boolean = false): Promise<{
    success: boolean;
    access_token: string;
    refresh_token: string;
    user_id?: number;
  }> {
    if (!(await this.otpService.verifyOtp(email, otpCode))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check Customer table
    const customer = await this.findCustomerByEmail(email);

    // If login attempt, customer must exist
    if (isLogin && !customer) {
      throw new NotFoundException('User not found. Please register first or check your email.');
    }

    // Generate tokens with app session expiration
    const appSessionExpiration = this.getAppSessionExpiration();
    let userId: number | null = null;
    const role = UserRole.USER;

    if (customer) {
      // Use customer
      userId = customer.id;
      // Update last login
      customer.last_login = new Date();
      await this.customerRepository.save(customer);
    }
    // If customer doesn't exist and not login, userId remains null (for registration flow)

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId || 0,
      email: email,
      role: role,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
    const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);

    // Store refresh token if customer exists
    if (customer) {
      await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'otp');
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId || undefined,
    };
  }

  /**
   * Check if user exists by phone or email
   * Used for forgot password flow to verify user exists before sending OTP
   */
  async checkUserExists(phoneNumber: string | null, email: string | null): Promise<boolean> {
    // Check Customer table only - pass original phone so all variations are tried
    if (phoneNumber) {
      const customer = await this.findCustomerByPhone(phoneNumber);
      if (customer) return true;
    }

    if (email) {
      const customer = await this.findCustomerByEmail(email);
      if (customer) return true;
    }

    return false;
  }

  /**
   * Reset password using OTP verification
   * Used for forgot password flow
   */
  async resetPasswordWithOtp(
    phoneNumber: string | null,
    email: string | null,
    otpCode: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate that either phone or email is provided
    if (!phoneNumber && !email) {
      throw new BadRequestException('Either phone_number or email is required');
    }

    // Verify OTP - normalize phone number to match how it was stored in OTP cache
    const otpIdentifier = phoneNumber ? normalizePhoneNumber(phoneNumber) : email;
    if (!(await this.otpService.verifyOtp(otpIdentifier, otpCode))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find customer - pass original phone so all variations are tried
    let customer: Customer | null = null;
    if (phoneNumber) {
      customer = await this.findCustomerByPhone(phoneNumber);
    } else if (email) {
      customer = await this.findCustomerByEmail(email);
    }

    if (!customer) {
      throw new NotFoundException('User not found. Please check your phone number or email.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    customer.password = hashedPassword;
    await this.customerRepository.save(customer);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async logout(refreshTokenString: string): Promise<void> {
    // Check CustomerToken table first (new normalized structure)
    const customerToken = await this.customerTokenRepository.findOne({
      where: { token: refreshTokenString, is_revoked: false },
    });

    if (customerToken) {
      customerToken.is_revoked = true;
      await this.customerTokenRepository.save(customerToken);
      return;
    }

    // Check AdminToken table
    const adminToken = await this.adminTokenRepository.findOne({
      where: { token: refreshTokenString, is_revoked: false },
    });

    if (adminToken) {
      adminToken.is_revoked = true;
      await this.adminTokenRepository.save(adminToken);
      return;
    }

    // Fallback to legacy RefreshToken table for backward compatibility
    const legacyToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString },
    });

    if (legacyToken) {
      legacyToken.is_revoked = true;
      await this.refreshTokenRepository.save(legacyToken);
    }
  }

  /**
   * Logout by revoking all active tokens for a user
   * Uses the authenticated user's ID from Bearer token
   */
  async logoutByUserId(userId: number, userType: string = 'user'): Promise<void> {
    if (userType === 'admin') {
      // Revoke all active admin tokens
      await this.adminTokenRepository.update(
        { added_by: userId, is_revoked: false },
        { is_revoked: true },
      );
    } else {
      // Revoke all active customer tokens
      await this.customerTokenRepository.update(
        { customer_id: userId, is_revoked: false },
        { is_revoked: true },
      );
    }
  }

  private async storeRefreshToken(
    token: string,
    userId: number | null,
    adminId: number | null,
    expiresIn?: string,
  ): Promise<void> {
    const payload = this.jwtService.verifyToken(token);
    if (!payload) return;

    // If expiresIn is provided, calculate expiration from now
    // Otherwise, use the expiration from the token payload
    let expiresAt: Date;
    if (expiresIn) {
      // Parse expiresIn (e.g., '90d', '7d', '15m')
      const expiresInMs = this.parseExpiresIn(expiresIn);
      expiresAt = new Date(Date.now() + expiresInMs);
    } else {
      expiresAt = new Date(payload.exp! * 1000);
    }

    const refreshToken = this.refreshTokenRepository.create({
      token,
      user_id: userId,
      admin_id: adminId,
      expires_at: expiresAt,
      is_revoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Parse expiresIn string to milliseconds
   * Supports: '90d', '7d', '15m', '1h', etc.
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 90 days if parsing fails
      return 90 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 90 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Validate customer by email/phone and password
   */
  async validateCustomerByPassword(
    username: string,
    password: string,
  ): Promise<Customer | null> {
    // Normalize phone number if it looks like a phone number (starts with + or is all digits)
    const normalizedUsername = username.startsWith('+') || /^\d+$/.test(username) 
      ? normalizePhoneNumber(username) 
      : username;
    
    // Find customer by email or phone_number
    const customer = await this.customerRepository.findOne({
      where: [
        { email: username, is_deleted: false },
        { phone_number: normalizedUsername, is_deleted: false },
        { phone_number: username, is_deleted: false }, // Also check original for backward compatibility
      ],
    });

    if (!customer || !customer.password) {
      return null;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return null;
    }

    return customer;
  }


  /**
   * Login with username/email and password
   * Checks Customer table only
   */
  async loginWithPassword(
    username: string,
    password: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Find customer
    const customer = await this.validateCustomerByPassword(username, password);
    
    if (!customer) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Update last login
    customer.last_login = new Date();
    await this.customerRepository.save(customer);
    return this.issueCustomerTokens(customer);
  }

  /**
   * Verify OTP and login (returns consistent format)
   * Uses Customer table only
   */
  async verifyOtpForLogin(
    phoneNumber: string,
    otpCode: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Normalize phone number before verification
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    if (!(await this.otpService.verifyOtp(normalizedPhone, otpCode))) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create customer by phone number - pass original to try all variations
    let customer = await this.findCustomerByPhone(phoneNumber);

    if (!customer) {
      // Create new customer
      customer = this.customerRepository.create({
        phone_number: normalizedPhone,
        is_verified: true,
        last_login: new Date(),
      });
      customer = await this.customerRepository.save(customer);
    } else {
      // Update last login
      customer.last_login = new Date();
      await this.customerRepository.save(customer);
    }

    // Use app tokens with configurable session expiration
    return this.issueCustomerAppTokens(customer);
  }

  /**
   * Login with Google ID token
   * Uses Customer table only
   */
  async loginWithGoogle(
    idToken: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Verify Google ID token
    const googleProfile = await this.verifyGoogleToken(idToken);
    if (!googleProfile) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    // Check Customer table
    let customer = await this.findCustomerByEmail(googleProfile.email);
    
    if (customer) {
      // Update avatar if provided and different
      if (googleProfile.picture && customer.avatar_url !== googleProfile.picture) {
        customer.avatar_url = googleProfile.picture;
      }
      // Update last login
      customer.last_login = new Date();
      await this.customerRepository.save(customer);
      
      // Use app tokens with configurable session expiration
      return this.issueCustomerAppTokens(customer);
    }

    // Create new customer
    customer = await this.findOrCreateGoogleCustomer(googleProfile);
    customer.last_login = new Date();
    await this.customerRepository.save(customer);
    
    // Use app tokens with configurable session expiration
    return this.issueCustomerAppTokens(customer);
  }


  /**
   * Find or create customer from Google profile (for new Google logins)
   */
  async findOrCreateGoogleCustomer(googleProfile: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }): Promise<Customer> {
    // Generate a unique phone number placeholder for Google users
    // Format: g_<hash> where hash is first 8 chars of Google ID + timestamp suffix
    // This ensures uniqueness while staying within varchar(20) limit
    const nameParts = googleProfile.name.split(' ');
    // Use first 8 chars of Google ID + last 9 chars of timestamp to fit in 20 chars (g_ = 2, + 18 = 20)
    const googleIdShort = googleProfile.googleId.substring(0, 8);
    const timestampShort = Date.now().toString().slice(-9); // Last 9 digits
    const phonePlaceholder = `g_${googleIdShort}${timestampShort}`;
    
    const customer = this.customerRepository.create({
      email: googleProfile.email,
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      avatar_url: googleProfile.picture || null,
      phone_number: phonePlaceholder,
      is_verified: true, // Google email is verified
      last_login: new Date(),
    });

    return await this.customerRepository.save(customer);
  }

  /**
   * Verify Google ID token
   * Supports multiple client IDs (Web, iOS, Android) - comma-separated in GOOGLE_CLIENT_ID
   * Note: Install google-auth-library: npm install google-auth-library
   */
  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  } | null> {
    try {
      // Check if GOOGLE_CLIENT_ID is configured
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID environment variable is not set');
        throw new Error('Google OAuth client ID not configured');
      }

      // Support multiple client IDs (comma-separated) for Web, iOS, Android
      const clientIds = process.env.GOOGLE_CLIENT_ID.split(',').map((id) => id.trim()).filter((id) => id.length > 0);

      if (clientIds.length === 0) {
        throw new Error('No valid Google OAuth client IDs configured');
      }

      // Try to use google-auth-library if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OAuth2Client } = require('google-auth-library');

      // Try to verify against each client ID (supports Web, iOS, Android)
      let lastError: Error | null = null;

      for (const clientId of clientIds) {
        try {
          const client = new OAuth2Client(clientId);

          const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
          });

          const payload = ticket.getPayload();
          if (!payload) {
            console.warn(`Google token verification failed for client ID ${clientId}: No payload returned`);
            continue;
          }

          // Successfully verified with this client ID
          console.debug(`Google token verified successfully with client ID: ${clientId.substring(0, 20)}...`);

          return {
            email: payload.email || '',
            name: payload.name || payload.email || '',
            picture: payload.picture,
            googleId: payload.sub,
          };
        } catch (error) {
          // Store error but continue trying other client IDs
          lastError = error instanceof Error ? error : new Error(String(error));
          console.debug(`Token verification failed for client ID ${clientId}: ${lastError.message}`);
          continue;
        }
      }

      // If we get here, all client IDs failed
      if (lastError) {
        throw lastError;
      }

      throw new Error('Google token verification failed for all configured client IDs');
    } catch (error) {
      // Log the actual error for debugging
      console.error('Google token verification error:', error);
      
      // Check if it's a module not found error
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        console.error(
          'Google auth library not installed. Install with: npm install google-auth-library',
        );
        console.error('Google login will not work until library is installed.');
      }
      
      return null;
    }
  }

  /**
   * Register a new customer
   */
  async register(
    name: string | undefined,
    email: string | undefined,
    phone_number: string | undefined,
    password: string,
    referralCode?: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Validate that at least email or phone_number is provided
    if (!email && !phone_number) {
      throw new BadRequestException('Either email or phone_number is required');
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Invalid email format');
      }
    }

    // Check if email already exists in Customer table
    if (email) {
      const existingCustomerByEmail = await this.customerRepository.findOne({
        where: { email, is_deleted: false },
      });
      if (existingCustomerByEmail) {
        throw new ConflictException('This email is already registered. Please use a different email or try logging in.');
      }
    }

    // Check if phone number already exists in Customer table
    if (phone_number) {
      const existingCustomerByPhone = await this.findCustomerByPhone(phone_number);
      if (existingCustomerByPhone) {
        throw new ConflictException('This phone number is already registered. Please use a different phone number or try logging in.');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Parse name into first_name and last_name
    let first_name: string | null = null;
    let last_name: string | null = null;
    if (name) {
      const nameParts = name.trim().split(' ');
      first_name = nameParts[0] || null;
      last_name = nameParts.slice(1).join(' ') || null;
    }

    // Generate phone_number placeholder if only email provided
    // Customer entity requires phone_number, so we create a unique placeholder
    let finalPhoneNumber = phone_number;
    if (!finalPhoneNumber && email) {
      // Create a shorter unique placeholder: e_<hash>_<timestamp>
      // Hash email to first 8 chars, use shorter timestamp
      const emailHash = Buffer.from(email)
        .toString('base64')
        .slice(0, 8)
        .replace(/[^a-zA-Z0-9]/g, '');
      const shortTimestamp = Date.now().toString().slice(-8); // Last 8 digits
      finalPhoneNumber = `e_${emailHash}_${shortTimestamp}`;
    } else if (!finalPhoneNumber) {
      throw new BadRequestException('Either email or phone_number is required');
    } else {
      // Normalize phone number: remove "+" prefix if present
      finalPhoneNumber = normalizePhoneNumber(finalPhoneNumber);
    }

    // Resolve referral code if provided
    let referredBy: number | null = null;
    const normalizedReferralCode = referralCode?.trim().toUpperCase() || null;
    if (normalizedReferralCode) {
      const referrer = await this.customerRepository.findOne({
        where: { referral_code: normalizedReferralCode, is_deleted: false },
      });
      if (!referrer) {
        throw new BadRequestException('Invalid referral code');
      }
      referredBy = referrer.id;
    }

    // Create new customer
    const customer = this.customerRepository.create({
      first_name,
      last_name,
      email: email || null,
      phone_number: finalPhoneNumber,
      password: hashedPassword,
      is_verified: email ? true : false, // Email registration is considered verified
      last_login: new Date(),
      referral_code: await this.generateUniqueReferralCode(),
      referred_by: referredBy,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Auto-upgrade referrer plan based on env-managed referral thresholds
    if (referredBy) {
      await this.applyReferralPlanUpgradeIfEligible(referredBy);
    }

    // Issue tokens
    return this.issueCustomerTokens(savedCustomer);
  }

  /**
   * Issue tokens for customer and return formatted response
   */
  private async issueCustomerTokens(customer: Customer): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: customer.id,
      email: customer.email || undefined,
      phone_number: customer.phone_number || undefined,
      role: UserRole.USER,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // Store refresh token in CustomerToken table
    await this.storeCustomerToken(refreshToken, customer.id);

    customer = await this.ensureCustomerReferralCode(customer);

    // Format customer response
    const userResponse = this.formatCustomerResponse(customer);

    // Get personalized horoscope for logged-in user based on their birth data
    try {
      const personalizedHoroscope = await this.horoscopeService.getHoroscopeForUser(
        customer.id,
        'daily',
      );
      userResponse.horoscope = personalizedHoroscope;
    } catch (error) {
      // If horoscope fails (e.g., no birth date), continue without it (don't block login)
      // User can update their profile with birth data to get personalized horoscope
      // No horoscope will be included in the response
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userResponse,
    };
  }

  /**
   * Issue tokens for customer with app session expiration (for app logins)
   */
  private async issueCustomerAppTokens(customer: Customer): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: customer.id,
      email: customer.email || undefined,
      phone_number: customer.phone_number || undefined,
      role: UserRole.USER,
      type: 'user',
    };

    // Get app session expiration from environment variable
    const appSessionExpiration = this.getAppSessionExpiration();
    const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
    const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);

    // Store refresh token in CustomerToken table with app session expiration
    await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'google');

    customer = await this.ensureCustomerReferralCode(customer);

    // Format customer response
    const userResponse = this.formatCustomerResponse(customer);

    // Get personalized horoscope for logged-in user based on their birth data
    try {
      const personalizedHoroscope = await this.horoscopeService.getHoroscopeForUser(
        customer.id,
        'daily',
      );
      userResponse.horoscope = personalizedHoroscope;
    } catch (error) {
      // If horoscope fails (e.g., no birth date), continue without it (don't block login)
      // User can update their profile with birth data to get personalized horoscope
      // No horoscope will be included in the response
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userResponse,
    };
  }

  /**
   * Store customer refresh token
   */
  private async storeCustomerToken(token: string, customerId: number): Promise<void> {
    const payload = this.jwtService.verifyToken(token);
    if (!payload) return;

    const expiresAt = new Date(payload.exp! * 1000);

    const customerToken = this.customerTokenRepository.create({
      token,
      customer_id: customerId,
      expires_at: expiresAt,
      is_revoked: false,
      login_method: 'password',
    });

    await this.customerTokenRepository.save(customerToken);
  }

  /**
   * Store customer refresh token with custom expiration (for app sessions)
   */
  private async storeCustomerRefreshToken(
    token: string,
    customerId: number,
    expiresIn?: string,
    loginMethod: 'password' | 'otp' | 'google' = 'otp',
  ): Promise<void> {
    const payload = this.jwtService.verifyToken(token);
    if (!payload) return;

    // If expiresIn is provided, calculate expiration from now
    // Otherwise, use the expiration from the token payload
    let expiresAt: Date;
    if (expiresIn) {
      // Parse expiresIn (e.g., '90d', '7d', '15m')
      const expiresInMs = this.parseExpiresIn(expiresIn);
      expiresAt = new Date(Date.now() + expiresInMs);
    } else {
      expiresAt = new Date(payload.exp! * 1000);
    }

    const customerToken = this.customerTokenRepository.create({
      token,
      customer_id: customerId,
      expires_at: expiresAt,
      is_revoked: false,
      login_method: loginMethod,
    });

    await this.customerTokenRepository.save(customerToken);
  }

  /**
   * Format customer response for API
   */
  private formatCustomerResponse(customer: Customer): any {
    return {
      id: customer.id,
      unique_id: customer.unique_id,
      name:
        customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`
          : customer.first_name || customer.last_name || null,
      email: customer.email,
      phone_number: customer.phone_number,
      avatar_url: customer.avatar_url,
      role: 'user',
      is_verified: customer.is_verified,
      referral_code: customer.referral_code,
      created_at: customer.added_date,
    };
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.customerRepository.findOne({
        where: { referral_code: code, is_deleted: false },
      });
      if (!existing) {
        return code;
      }
      attempts++;
    }
    return `RF${Date.now().toString().slice(-6)}`;
  }

  private async ensureCustomerReferralCode(customer: Customer): Promise<Customer> {
    if (customer.referral_code) {
      return customer;
    }

    const candidate = `IBHAKT${customer.id}`;
    const existing = await this.customerRepository.findOne({
      where: { referral_code: candidate, is_deleted: false },
    });

    customer.referral_code = existing && existing.id !== customer.id
      ? await this.generateUniqueReferralCode()
      : candidate;

    return this.customerRepository.save(customer);
  }

  private async applyReferralPlanUpgradeIfEligible(referrerUserId: number): Promise<void> {
    const proCountRaw =
      process.env.REFERAL_PRO_COUNT || process.env.REFERRAL_PRO_COUNT || '5';
    const masterCountRaw =
      process.env.REFERAL_MASTER_COUNT || process.env.REFERRAL_MASTER_COUNT || '10';

    const proCount = Number(proCountRaw);
    const masterCount = Number(masterCountRaw);

    const totalReferrals = await this.customerRepository.count({
      where: { referred_by: referrerUserId, is_deleted: false },
    });

    let targetPlanType: PlanType | null = null;
    if (Number.isFinite(masterCount) && masterCount > 0 && totalReferrals >= masterCount) {
      targetPlanType = PlanType.PREMIUM;
    } else if (Number.isFinite(proCount) && proCount > 0 && totalReferrals >= proCount) {
      targetPlanType = PlanType.PAID;
    }

    if (!targetPlanType) {
      return;
    }

    const referrer = await this.customerRepository.findOne({
      where: { id: referrerUserId, is_deleted: false },
    });
    if (!referrer) {
      return;
    }

    const current = referrer.current_plan;
    const currentRank = this.getPlanRank(current);
    const targetRank = this.getPlanRank(targetPlanType);
    if (currentRank >= targetRank) {
      return;
    }

    const targetPlan = await this.subscriptionsService.getActivePlanByType(targetPlanType);
    if (!targetPlan) {
      return;
    }

    await this.subscriptionsService.createSubscription(
      referrerUserId,
      targetPlan.id,
      new Date(),
    );
  }

  private getPlanRank(planType: PlanType | null | undefined): number {
    if (planType === PlanType.PREMIUM) return 4;
    if (planType === PlanType.PAID) return 3;
    if (planType === PlanType.REFERRAL) return 2;
    return 1;
  }


  /**
   * Get current authenticated user information
   */
  async getCurrentUser(userPayload: any): Promise<any> {
    const userId = userPayload.id;
    const userType = userPayload.type || 'user';

    if (userType === 'admin') {
      const admin = await this.adminUserRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (!admin) {
        throw new UnauthorizedException('Admin user not found');
      }

      return {
        id: admin.id,
        unique_id: admin.unique_id,
        name: admin.first_name && admin.last_name
          ? `${admin.first_name} ${admin.last_name}`
          : admin.first_name || admin.last_name || null,
        email: admin.email,
        username: admin.username,
        avatar_url: admin.avatar_url,
        role: 'admin',
        type: 'admin',
        is_active: admin.is_active,
        created_at: admin.added_date,
      };
    } else {
      // Check Customer table only
      const customer = await this.customerRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (!customer) {
        throw new UnauthorizedException('User not found');
      }

      const safeCustomer = await this.ensureCustomerReferralCode(customer);
      return this.formatCustomerResponse(safeCustomer);
    }
  }

  /**
   * Refresh access token (updated to return user)
   */
  async refreshAccessToken(refreshTokenString: string): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Verify token
    const payload = this.jwtService.verifyToken(refreshTokenString);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check CustomerToken table first (new normalized structure)
    let customerToken = await this.customerTokenRepository.findOne({
      where: { token: refreshTokenString, is_revoked: false },
    });

    if (customerToken) {
      // Token is in CustomerToken table
      if (customerToken.expires_at < new Date()) {
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      // Get customer
      const customer = await this.customerRepository.findOne({
        where: { id: customerToken.customer_id, is_deleted: false },
      });

      if (!customer) {
        throw new UnauthorizedException('User not found');
      }

      // Check if this is an app token by comparing expiration with configured app session duration
      const appSessionDays = this.configService.get<number>('APP_SESSION_DAYS', 90);
      const originalExpiration = payload.exp ? payload.exp * 1000 : 0;
      const now = Date.now();
      const daysUntilExpiration = (originalExpiration - now) / (1000 * 60 * 60 * 24);
      const isAppToken = daysUntilExpiration >= (appSessionDays - 5) && daysUntilExpiration <= (appSessionDays + 5);

      // Generate new tokens
      const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: customer.id,
        phone_number: customer.phone_number || undefined,
        email: customer.email || undefined,
        role: UserRole.USER,
        type: 'user',
      };

      // Use app session expiration for app tokens, default for others
      const expiresIn = isAppToken ? this.getAppSessionExpiration() : undefined;
      const newAccessToken = this.jwtService.generateAccessToken(newPayload, expiresIn);
      const newRefreshToken = this.jwtService.generateRefreshToken(newPayload, expiresIn);

      // Revoke old token
      customerToken.is_revoked = true;
      await this.customerTokenRepository.save(customerToken);

      // Store new refresh token
      await this.storeCustomerRefreshToken(
        newRefreshToken,
        customer.id,
        expiresIn,
        customerToken.login_method || 'password',
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: this.formatCustomerResponse(await this.ensureCustomerReferralCode(customer)),
      };
    }

    // Fallback to legacy RefreshToken table for backward compatibility
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString, is_revoked: false },
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Get customer from legacy token
    const customer = await this.customerRepository.findOne({
      where: { id: payload.sub, is_deleted: false },
    });

    if (!customer) {
      throw new UnauthorizedException('User not found');
    }

    // Check if this is an app token
    const appSessionDays = this.configService.get<number>('APP_SESSION_DAYS', 90);
    const originalExpiration = payload.exp ? payload.exp * 1000 : 0;
    const now = Date.now();
    const daysUntilExpiration = (originalExpiration - now) / (1000 * 60 * 60 * 24);
    const isAppToken = daysUntilExpiration >= (appSessionDays - 5) && daysUntilExpiration <= (appSessionDays + 5);

    // Generate new tokens
    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: customer.id,
      phone_number: customer.phone_number || undefined,
      email: customer.email || undefined,
      role: UserRole.USER,
      type: 'user',
    };

    // Use app session expiration for app tokens, default for others
    const expiresIn = isAppToken ? this.getAppSessionExpiration() : undefined;
    const newAccessToken = this.jwtService.generateAccessToken(newPayload, expiresIn);
    const newRefreshToken = this.jwtService.generateRefreshToken(newPayload, expiresIn);

    // Revoke old token
    tokenRecord.is_revoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Store new refresh token in CustomerToken table
    await this.storeCustomerRefreshToken(
      newRefreshToken,
      customer.id,
      expiresIn,
      'password',
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: this.formatCustomerResponse(await this.ensureCustomerReferralCode(customer)),
    };
  }

  /**
   * Find customer by phone number (checks Customer table first)
   * Tries multiple variations to handle different storage formats
   * (some records may have "+", some may not)
   */
  private async findCustomerByPhone(phoneNumber: string): Promise<Customer | null> {
    // First normalize: remove "+" prefix if present
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Also try variations (remove all non-digits, last 10 digits)
    const digitsOnly = normalizedPhone.replace(/\D+/g, '');

    // Build unique set of variations to try
    const variationsSet = new Set<string>();
    variationsSet.add(normalizedPhone.trim());          // e.g. "1234567890"
    variationsSet.add(`+${normalizedPhone.trim()}`);    // e.g. "+1234567890" (DB may store with +)
    variationsSet.add(digitsOnly);                       // e.g. "1234567890"
    if (digitsOnly.length > 10) {
      variationsSet.add(digitsOnly.slice(-10));          // Last 10 digits
    }
    variationsSet.add(phoneNumber.trim());               // Original input as-is

    for (const variation of variationsSet) {
      if (!variation) continue;
      const customer = await this.customerRepository.findOne({
        where: { phone_number: variation, is_deleted: false },
      });
      if (customer) return customer;
    }

    return null;
  }

  /**
   * Find customer by email (checks Customer table first)
   */
  private async findCustomerByEmail(email: string): Promise<Customer | null> {
    const normalizedEmail = email.trim().toLowerCase();
    
    const customer = await this.customerRepository.findOne({
      where: { email: normalizedEmail, is_deleted: false },
    });

    return customer || null;
  }

}

