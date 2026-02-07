import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../auth.service';
import { SendOtpDto } from '../../dto/send-otp.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { LoginGoogleDto } from '../../dto/login-google.dto';
import { SendForgotPasswordOtpDto, ResetPasswordDto } from '../../dto/forgot-password.dto';
import { LoginPasswordDto } from '../../dto/login-password.dto';
import { RegisterDto } from '../../dto/register.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { IsEmail, IsString } from 'class-validator';

// DTOs for email OTP
class SendEmailOtpDto {
  @IsEmail()
  email: string;
}

class VerifyEmailOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  is_login?: boolean;
}

@ApiTags('Auth (App)')
@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new customer account (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields or invalid email format' })
  @ApiResponse({ status: 409, description: 'Email or phone number already registered' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(
      dto.name,
      dto.email,
      dto.phone_number,
      dto.password,
    );
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
      },
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username/email and password (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access_token, refresh_token, and user',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginPasswordDto) {
    const result = await this.authService.loginWithPassword(dto.username, dto.password);
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
      },
    };
  }

  @Post('otp/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    const result = await this.authService.sendOtp(dto.phone_number);
    
    // App-specific response format
    return {
      success: true,
      message: result.message,
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/resend')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to phone number (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests. Please wait before requesting again.' })
  async resendOtp(@Body() dto: SendOtpDto) {
    // Reuse the same sendOtp service method (it generates a new OTP each time)
    const result = await this.authService.sendOtp(dto.phone_number);
    
    // App-specific response format
    return {
      success: true,
      message: 'OTP resent successfully',
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access/refresh tokens (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP verified, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(
      dto.phone_number,
      dto.otp_code,
      dto.is_login || false,
    );
    
    // App-specific response format
    return {
      success: result.success,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
      },
    };
  }

  @Post('otp/email/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email address (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    const result = await this.authService.sendEmailOtp(dto.email);
    
    return {
      success: true,
      message: result.message,
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/email/resend')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to email address (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests. Please wait before requesting again.' })
  async resendEmailOtp(@Body() dto: SendEmailOtpDto) {
    // Reuse the same sendEmailOtp service method (it generates a new OTP each time)
    const result = await this.authService.sendEmailOtp(dto.email);
    
    return {
      success: true,
      message: 'OTP resent successfully',
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/email/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP and get access/refresh tokens (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP verified, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    const result = await this.authService.verifyEmailOtp(
      dto.email,
      dto.otp_code,
      dto.is_login || false,
    );
    
    return {
      success: result.success,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
      },
    };
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google (Mobile App)' })
  @ApiResponse({ status: 200, description: 'Google login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid Google ID token' })
  async loginWithGoogle(@Body() dto: LoginGoogleDto) {
    const result = await this.authService.loginWithGoogle(dto.id_token);
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (Mobile App)' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshAccessToken(dto.refresh_token);
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke all active tokens (Mobile App)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Bearer token required' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logoutByUserId(user.id, user.type);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password/send-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset (Mobile App)' })
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

  @Post('forgot-password/resend-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP for password reset (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Either phone_number or email is required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests. Please wait before requesting again.' })
  async resendForgotPasswordOtp(@Body() dto: SendForgotPasswordOtpDto) {
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

    // Resend OTP to phone or email (reuses sendOtp/sendEmailOtp which generate new OTP)
    let result;
    if (dto.phone_number) {
      result = await this.authService.sendOtp(dto.phone_number);
    } else if (dto.email) {
      result = await this.authService.sendEmailOtp(dto.email);
    }

    return {
      success: true,
      message: 'OTP resent successfully',
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('forgot-password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP (Mobile App)' })
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





