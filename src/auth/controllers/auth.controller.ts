import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import { LoginPasswordDto } from '../dto/login-password.dto';
import { LoginGoogleDto } from '../dto/login-google.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { SendForgotPasswordOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields' })
  @ApiResponse({ status: 409, description: 'Email or phone number already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.name,
      dto.email,
      dto.phone_number,
      dto.password,
    );
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto.username, dto.password);
  }

  @Post('otp/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone_number);
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpForLogin(
      dto.phone_number,
      dto.otp_code,
    );
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google (Gmail) using ID token' })
  @ApiResponse({
    status: 200,
    description: 'Google login successful, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google ID token' })
  async loginWithGoogle(@Body() dto: LoginGoogleDto) {
    return this.authService.loginWithGoogle(dto.id_token);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New tokens generated, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: any) {
    return this.authService.getCurrentUser(req.user);
  }

  @Post('forgot-password/send-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Either phone_number or email is required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendForgotPasswordOtp(@Body() dto: SendForgotPasswordOtpDto) {
    // Validate that either phone or email is provided
    if (!dto.phone_number && !dto.email) {
      throw new BadRequestException('Either phone_number or email is required');
    }

    // Check if user exists first (security: don't send OTP to non-existent users)
    const userExists = await this.authService.checkUserExists(
      dto.phone_number || null,
      dto.email || null,
    );

    if (!userExists) {
      throw new NotFoundException('User not found. Please check your phone number or email.');
    }

    // Send OTP to phone or email
    let result;
    if (dto.phone_number) {
      result = await this.authService.sendOtp(dto.phone_number);
    } else if (dto.email) {
      result = await this.authService.sendEmailOtp(dto.email);
    }

    return {
      success: true,
      message: result.message,
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('forgot-password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPasswordWithOtp(
      dto.phone_number || null,
      dto.email || null,
      dto.otp_code,
      dto.new_password,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }
}

