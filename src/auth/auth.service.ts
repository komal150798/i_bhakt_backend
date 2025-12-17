import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Customer } from '../users/entities/customer.entity';
import { AdminUser } from '../users/entities/admin-user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CustomerToken } from './entities/customer-token.entity';
import { AdminToken } from './entities/admin-token.entity';
import { OtpService } from './services/otp.service';
import { AuthJwtService } from './services/jwt.service';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
  ) {}

  async sendOtp(phoneNumber: string): Promise<{ message: string; debug_code?: string }> {
    const code = this.otpService.issueOtp(phoneNumber);
    const response: { message: string; debug_code?: string } = {
      message: 'OTP sent successfully',
    };
    
    // In non-production, include debug code
    if (process.env.APP_ENV !== 'production') {
      response.debug_code = code;
    }
    
    // TODO: In production, send OTP via SMS service
    // await this.smsService.sendOtp(phoneNumber, code);
    
    return response;
  }

  async sendEmailOtp(email: string): Promise<{ message: string; debug_code?: string }> {
    const code = this.otpService.issueOtp(email);
    const response: { message: string; debug_code?: string } = {
      message: 'OTP sent successfully to email',
    };
    
    // In non-production, include debug code
    if (process.env.APP_ENV !== 'production') {
      response.debug_code = code;
    }
    
    // TODO: In production, send OTP via email service
    // await this.emailService.sendOtp(email, code);
    
    return response;
  }

  async verifyOtp(phoneNumber: string, otpCode: string, isLogin: boolean = false): Promise<{
    success: boolean;
    access_token: string;
    refresh_token: string;
    user_id?: number;
  }> {
    if (!this.otpService.verifyOtp(phoneNumber, otpCode)) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find user by phone number
    const user = await this.findUserByPhone(phoneNumber);

    // If login attempt, user must exist
    if (isLogin && !user) {
      throw new NotFoundException('User not found. Please register first or check your phone number.');
    }

    // Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user?.id || 0, // Will be set properly when user is created
      phone_number: phoneNumber,
      role: user?.role || UserRole.USER,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // Store refresh token if user exists
    if (user) {
      await this.storeRefreshToken(refreshToken, user.id, null);
      payload.sub = user.id;
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: user?.id,
    };
  }

  async verifyEmailOtp(email: string, otpCode: string, isLogin: boolean = false): Promise<{
    success: boolean;
    access_token: string;
    refresh_token: string;
    user_id?: number;
  }> {
    if (!this.otpService.verifyOtp(email, otpCode)) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find user by email
    const user = await this.findUserByEmail(email);

    // If login attempt, user must exist
    if (isLogin && !user) {
      throw new NotFoundException('User not found. Please register first or check your email.');
    }

    // Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user?.id || 0,
      email: email,
      role: user?.role || UserRole.USER,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // Store refresh token if user exists
    if (user) {
      await this.storeRefreshToken(refreshToken, user.id, null);
      payload.sub = user.id;
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: user?.id,
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

  private async storeRefreshToken(
    token: string,
    userId: number | null,
    adminId: number | null,
  ): Promise<void> {
    const payload = this.jwtService.verifyToken(token);
    if (!payload) return;

    const expiresAt = new Date(payload.exp! * 1000);

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
   * Validate customer by email/phone and password
   */
  async validateCustomerByPassword(
    username: string,
    password: string,
  ): Promise<Customer | null> {
    // Find customer by email or phone_number
    const customer = await this.customerRepository.findOne({
      where: [
        { email: username, is_deleted: false },
        { phone_number: username, is_deleted: false },
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
   * Validate user by username/email and password (Legacy - for backward compatibility)
   */
  async validateUserByPassword(
    username: string,
    password: string,
  ): Promise<User | null> {
    // Find user by email or username (assuming email can be used as username)
    const user = await this.userRepository.findOne({
      where: [
        { email: username, is_deleted: false },
        // If you have a username field, add it here
      ],
    });

    if (!user || !user.password) {
      return null;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login with username/email and password
   * Checks Customer table first, then falls back to User table for backward compatibility
   */
  async loginWithPassword(
    username: string,
    password: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // First, try to find customer (new normalized structure)
    let customer = await this.validateCustomerByPassword(username, password);
    
    if (customer) {
      // Update last login
      customer.last_login = new Date();
      await this.customerRepository.save(customer);
      return this.issueCustomerTokens(customer);
    }

    // Fallback to legacy User table for backward compatibility
    const user = await this.validateUserByPassword(username, password);
    if (user) {
      // Update last login
      user.last_login = new Date();
      await this.userRepository.save(user);
      return this.issueTokens(user);
    }

    // Neither customer nor user found
    throw new UnauthorizedException('Invalid username or password');
  }

  /**
   * Verify OTP and login (returns consistent format)
   */
  async verifyOtpForLogin(
    phoneNumber: string,
    otpCode: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    if (!this.otpService.verifyOtp(phoneNumber, otpCode)) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create user by phone number
    let user = await this.findUserByPhone(phoneNumber);

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        phone_number: phoneNumber,
        role: UserRole.USER,
        is_verified: true,
        last_login: new Date(),
      });
      user = await this.userRepository.save(user);
    } else {
      // Update last login
      user.last_login = new Date();
      await this.userRepository.save(user);
    }

    return this.issueTokens(user);
  }

  /**
   * Login with Google ID token
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

    // Find or create user
    const user = await this.findOrCreateGoogleUser(googleProfile);

    // Update last login
    user.last_login = new Date();
    await this.userRepository.save(user);

    return this.issueTokens(user);
  }

  /**
   * Issue tokens and return formatted response
   */
  async issueTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email || undefined,
      phone_number: user.phone_number || undefined,
      role: user.role,
      type: 'user',
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // Store refresh token
    await this.storeRefreshToken(refreshToken, user.id, null);

    // Format user response
    const userResponse = this.formatUserResponse(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userResponse,
    };
  }

  /**
   * Find or create user from Google profile
   */
  async findOrCreateGoogleUser(googleProfile: {
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  }): Promise<User> {
    // Try to find user by email
    let user = await this.userRepository.findOne({
      where: { email: googleProfile.email, is_deleted: false },
    });

    if (user) {
      // Update avatar if provided and different
      if (googleProfile.picture && user.avatar_url !== googleProfile.picture) {
        user.avatar_url = googleProfile.picture;
        await this.userRepository.save(user);
      }
      return user;
    }

    // Create new user
    // Generate a unique phone number placeholder for Google users
    // Format: google_<first_10_chars_of_googleId>_<timestamp>
    const nameParts = googleProfile.name.split(' ');
    const phonePlaceholder = `google_${googleProfile.googleId.substring(0, 10)}_${Date.now()}`;
    
    user = this.userRepository.create({
      email: googleProfile.email,
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(' ') || null,
      avatar_url: googleProfile.picture || null,
      role: UserRole.USER,
      is_verified: true, // Google email is verified
      phone_number: phonePlaceholder,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Verify Google ID token
   * Note: Install google-auth-library: npm install google-auth-library
   */
  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    name: string;
    picture?: string;
    googleId: string;
  } | null> {
    try {
      // Try to use google-auth-library if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }

      return {
        email: payload.email || '',
        name: payload.name || payload.email || '',
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch (error) {
      // If google-auth-library is not installed, log warning and return null
      console.warn(
        'Google auth library not installed. Install with: npm install google-auth-library',
      );
      console.warn('Google login will not work until library is installed.');
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
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    // Validate that at least email or phone_number is provided
    if (!email && !phone_number) {
      throw new BadRequestException('Either email or phone_number is required');
    }

    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: [
        ...(email ? [{ email, is_deleted: false }] : []),
        ...(phone_number ? [{ phone_number, is_deleted: false }] : []),
      ],
    });

    if (existingCustomer) {
      throw new ConflictException(
        email && existingCustomer.email === email
          ? 'Email already registered'
          : 'Phone number already registered',
      );
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
    });

    const savedCustomer = await this.customerRepository.save(customer);

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

    // Format customer response
    const userResponse = this.formatCustomerResponse(customer);

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
      created_at: customer.added_date,
    };
  }

  /**
   * Format user response for API
   */
  private formatUserResponse(user: User): any {
    return {
      id: user.id,
      unique_id: user.unique_id,
      name: user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.last_name || null,
      email: user.email,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      role: user.role,
      created_at: user.added_date,
    };
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
      // Check Customer table first
      const customer = await this.customerRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (customer) {
        return this.formatCustomerResponse(customer);
      }

      // Fallback to legacy User table
      const user = await this.userRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.formatUserResponse(user);
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

    // Check if token exists in database and is not revoked
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString, is_revoked: false },
      relations: ['user', 'admin'],
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_deleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: payload.sub,
      phone_number: payload.phone_number,
      email: payload.email,
      role: payload.role,
      type: payload.type,
    };

    const newAccessToken = this.jwtService.generateAccessToken(newPayload);
    const newRefreshToken = this.jwtService.generateRefreshToken(newPayload);

    // Revoke old token
    tokenRecord.is_revoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Store new refresh token
    await this.storeRefreshToken(
      newRefreshToken,
      payload.type === 'user' ? payload.sub : null,
      payload.type === 'admin' ? payload.sub : null,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: this.formatUserResponse(user),
    };
  }

  private async findUserByPhone(phoneNumber: string): Promise<User | null> {
    // Normalize phone number (remove non-digits, handle variations)
    const normalized = phoneNumber.replace(/\D+/g, '');
    
    // Try multiple variations
    const variations = [
      phoneNumber.trim(),
      normalized,
      normalized.slice(-10), // Last 10 digits
    ];

    for (const variation of variations) {
      const user = await this.userRepository.findOne({
        where: { phone_number: variation },
      });
      if (user) return user;
    }

    return null;
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail, is_deleted: false },
    });

    return user || null;
  }
}

